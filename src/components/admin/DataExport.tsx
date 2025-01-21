import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, IconButton } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FACTOR_WORDS } from '../../utils/trialGenerator';
import DownloadIcon from '@mui/icons-material/Download';
import { WordType } from '../../types';

const PIN = '1921';

interface TrialData {
  participantId: string;
  participantNickname: string;
  imageFileName: string;
  word: string;
  wordType: WordType;
  isCorrect: boolean;
  reactionTimeMs: number;
  timestamp: Date;
}

// Создаем словарь для быстрого поиска фактора и коннотации по слову
const factorWordMap = FACTOR_WORDS.reduce((acc, fw) => {
  acc[fw.word] = { factor: fw.factor, connotation: fw.connotation };
  return acc;
}, {} as { [key: string]: { factor: string; connotation: string } });

// Загружаем словарь моделей
async function loadModelDictionary(): Promise<{ [key: string]: string }> {
  try {
    console.log('Loading model dictionary...');
    const response = await fetch('/data/dictionary.tsv');
    if (!response.ok) {
      console.error('Failed to load dictionary.tsv:', response.status, response.statusText);
      throw new Error('Failed to load dictionary.tsv');
    }
    
    const text = await response.text();
    console.log('Dictionary content:', text.slice(0, 100) + '...'); // Показываем первые 100 символов
    
    const rows = text.trim().split('\n').map(row => row.split('\t'));
    const [header, ...data] = rows;
    
    console.log('Header:', header);
    console.log('First row:', data[0]);
    
    // Создаем словарь, где ключ - имя файла (0.png, 1.png, ...), значение - модель
    const dict = data.reduce((acc, [, , model], index) => {
      const key = `${index}.png`;
      const value = model?.trim() || '';
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: string });
    
    console.log('Dictionary entries:', Object.keys(dict).length);
    console.log('Sample entries:', Object.entries(dict).slice(0, 3));
    
    return dict;
  } catch (error) {
    console.error('Error loading model dictionary:', error);
    return {};
  }
}

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
      // Загружаем словарь моделей
      const modelDictionary = await loadModelDictionary();

      // Получаем все результаты испытаний
      const querySnapshot = await getDocs(collection(db, 'trials'));
      
      // Преобразуем данные в строки CSV
      const headers = [
        'participantId',
        'participantNickname',
        'imageFileName',
        'model',
        'word',
        'wordType',
        'factor',
        'connotation',
        'isCorrect',
        'reactionTime',
        'timestamp'
      ].join(',');

      // Сортируем результаты по времени, чтобы сохранить историю
      const rows = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          const factorInfo = factorWordMap[data.word] || { factor: '', connotation: '' };
          const model = modelDictionary[data.imageFileName] || '';

          return {
            data: [
              data.participantId,
              data.participantNickname,
              data.imageFileName,
              model,
              data.word,
              data.wordType,
              data.wordType === 'factor' ? factorInfo.factor : '',
              data.wordType === 'factor' ? factorInfo.connotation : 
                (data.wordType === 'target' ? 'target' : 
                 data.wordType === 'antonym' ? 'antonym' : ''),
              data.isCorrect,
              data.reactionTimeMs,
              data.timestamp?.toDate?.()?.toISOString() || ''
            ].join(','),
            timestamp: data.timestamp?.toDate?.() || new Date(0)
          };
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map(row => row.data);

      // Создаем и скачиваем файл
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'experiment_results.csv';
      link.click();

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
            label="PIN-код"
            type="password"
            fullWidth
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            error={error}
            helperText={error ? 'Неверный PIN-код' : ''}
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