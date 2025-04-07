import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config.tsx';
import { AESTHETIC_WORDS } from '../../utils/wordBank';
import DownloadIcon from '@mui/icons-material/Download';
import { WordType } from '../../types';
import { loadModelDictionary } from '../../utils/trialGenerator';

const PIN = '1921';

interface TrialDataFromFirestore {
  participantId: string;
  participantNickname: string;
  imageFileName: string;
  word: string;
  wordType: WordType | string;
  isCorrect: boolean;
  reactionTimeMs: number;
  timestamp: any;
}

const aestheticWordMap = AESTHETIC_WORDS.reduce((acc, aw) => {
  acc[aw.word] = { factor: aw.factor, connotation: aw.connotation };
  return acc;
}, {} as { [key: string]: { factor: number; connotation: string } });

export function DataExport() {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (pin !== PIN) {
      setError(true);
      return;
    }

    setLoading(true);
    try {
      const modelDictionary = await loadModelDictionary();
      if (Object.keys(modelDictionary).length === 0) {
        console.error("Failed to load model dictionary for export.");
        alert("Ошибка: Не удалось загрузить словарь моделей для экспорта.");
        return;
      }
      
      await exportTrialsData(modelDictionary);
      setOpen(false);
      setPin('');
      setError(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Ошибка при экспорте данных');
    } finally {
      setLoading(false);
    }
  };

  const exportTrialsData = async (modelDictionary: { [key: string]: string }) => {
    try {
      // Загружаем данные о промптах и файлах
      const response = await fetch('/data/exp2_samples.csv');
      if (!response.ok) {
        throw new Error(`Failed to load exp2_samples.csv: ${response.statusText}`);
      }
      const csvText = await response.text();
      
      // Создаем структуры для быстрого поиска
      const promptByFile: { [fileName: string]: string } = {};
      const filesByPrompt: { [prompt: string]: string[] } = {};
      const modelByFile: { [fileName: string]: string } = {};
      
      // Пропускаем заголовок
      const lines = csvText.split('\n').slice(1);
      
      for (const line of lines) {
        // Парсим CSV с учетом кавычек
        let inQuotes = false;
        let fields: string[] = [];
        let currentField = "";
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = "";
          } else {
            currentField += char;
          }
        }
        fields.push(currentField); // Добавляем последнее поле
        
        // Структура CSV: index,prompt,model_name,file_name
        if (fields.length >= 4) {
          const prompt = fields[1].trim().replace(/^"|"$/g, '');
          const model = fields[2].trim();
          const fileName = fields[3].trim();
          
          promptByFile[fileName] = prompt;
          modelByFile[fileName] = model;
          
          if (!filesByPrompt[prompt]) {
            filesByPrompt[prompt] = [];
          }
          filesByPrompt[prompt].push(fileName);
        }
      }
      
      // Анализ промптов и моделей
      const promptsWithSingleModel = new Set<string>();
      const promptsWithBothModels = new Set<string>();
      
      Object.entries(filesByPrompt).forEach(([prompt, files]) => {
        const models = new Set(files.map(file => modelByFile[file]));
        if (models.size === 1) {
          promptsWithSingleModel.add(prompt);
        } else if (models.size > 1) {
          promptsWithBothModels.add(prompt);
        }
      });
      
      console.log(`Prompts analysis: ${promptsWithSingleModel.size} prompts with single model, ${promptsWithBothModels.size} prompts with both models`);
      
      // Список проблемных файлов (без пар)
      const filesWithoutPairs = new Set<string>();
      
      // Функция для поиска ассоциированного файла
      const findAssociatedFile = (fileName: string): string => {
        const prompt = promptByFile[fileName];
        if (!prompt) {
          console.log(`No prompt found for file: ${fileName}`);
          filesWithoutPairs.add(fileName);
          return '';
        }
        
        const files = filesByPrompt[prompt] || [];
        const currentModel = modelByFile[fileName];
        
        // Проверяем, есть ли другие модели для этого промпта
        const otherModels = new Set(files.map(f => modelByFile[f]).filter(m => m !== currentModel));
        
        if (otherModels.size === 0) {
          // Для этого промпта нет других моделей
          filesWithoutPairs.add(fileName);
          return '';
        }
        
        // Находим файл с тем же промптом, но другой моделью
        const associatedFile = files.find(file => 
          file !== fileName && modelByFile[file] !== currentModel
        );
        
        if (!associatedFile) {
          filesWithoutPairs.add(fileName);
          return '';
        }
        
        return associatedFile;
      };
      
      // Продолжаем с экспортом данных
      const sessionsQuerySnapshot = await getDocs(collection(db, 'sessions'));
      const sessionsMap = new Map();
      
      sessionsQuerySnapshot.docs.forEach(doc => {
        const sessionData = doc.data();
        const key = `${sessionData.participantId}_${sessionData.nickname}`;
        if (!sessionsMap.has(key) || sessionData.timestamp.toMillis() > sessionsMap.get(key).timestamp.toMillis()) {
          sessionsMap.set(key, {
            deviceType: sessionData.deviceType || 'desktop',
            timestamp: sessionData.timestamp
          });
        }
      });
      
      console.log('Loaded device info from sessions:', sessionsMap.size);

      const querySnapshot = await getDocs(collection(db, 'trials'));
      
      console.log('Using pre-loaded model dictionary for export:', Object.keys(modelDictionary).length);
      console.log('Loaded prompt data for files:', Object.keys(promptByFile).length);
      
      const headers = [
        'participantId',
        'participantNickname',
        'imageFileName',
        'model',
        'associatedFile', // Новая колонка
        'hasPair',        // Добавляем флаг наличия пары
        'word',
        'wordType',
        'factor',
        'connotation',
        'isCorrect',
        'reactionTimeMs',
        'deviceType',
        'timestamp'
      ].join(',');

      const rows = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as TrialDataFromFirestore;
          const aestheticInfo = aestheticWordMap[data.word] || { factor: '', connotation: '' };
          
          const model = modelDictionary[data.imageFileName] || 'not_found';
          const associatedFile = findAssociatedFile(data.imageFileName);
          const hasPair = associatedFile ? 'true' : 'false';
          
          const deviceKey = `${data.participantId}_${data.participantNickname}`;
          const deviceInfo = sessionsMap.get(deviceKey);
          const deviceType = deviceInfo ? deviceInfo.deviceType : 'desktop';

          return {
            data: [
              data.participantId || '',
              data.participantNickname || '',
              data.imageFileName || '',
              model,
              associatedFile, // Добавляем ассоциированный файл
              hasPair,        // Добавляем флаг наличия пары
              data.word || '',
              data.wordType || '',
              data.wordType === 'aesthetic' ? aestheticInfo.factor : '',
              data.wordType === 'aesthetic' ? aestheticInfo.connotation : '',
              data.isCorrect,
              data.reactionTimeMs,
              deviceType,
              data.timestamp?.toDate?.()?.toISOString() || ''
            ].map(value => `"${String(value).replace(/"/g, '""' )}"`).join(','),
            timestamp: data.timestamp?.toDate?.() || new Date(0)
          };
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(row => row.data);

      console.log(`Analysis complete: ${filesWithoutPairs.size} files without pairs out of ${Object.keys(promptByFile).length} total files`);
      console.log('Examples of files without pairs:', Array.from(filesWithoutPairs).slice(0, 10));

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'experiment_results_v2.csv';
      link.click();
    } catch (error) {
      console.error('Error processing exp2_samples.csv or exporting data:', error);
      throw error;
    }
  };

  return (
    <Box sx={{ position: 'fixed', top: 8, right: 8, zIndex: 1000 }}>
      <IconButton
        onClick={() => setOpen(true)}
        size="small"
        sx={{
          bgcolor: 'background.paper',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: 'background.paper',
          }
        }}
      >
        <DownloadIcon fontSize="small" />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Выгрузка результатов</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Пароль"
            type="password"
            fullWidth
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            error={error}
            helperText={error ? 'Неверный пароль' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleExport} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Выгрузить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 