import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FACTOR_WORDS } from '../../utils/trialGenerator';

const PIN = '1921';

interface TrialData {
  participantId: string;
  participantNickname: string;
  imageFileName: string;
  word: string;
  wordType: 'target' | 'antonym' | 'factor' | 'non-word';
  isCorrect: boolean;
  reactionTimeMs: number;
  timestamp: Date;
}

// Создаем словарь для быстрого поиска категории и коннотации факторных слов
const factorWordMap = FACTOR_WORDS.reduce((acc: { [key: string]: { factor: string; connotation: string } }, { word, category }) => {
  const [factor, connotation] = category.split('_');
  acc[word] = {
    factor: factor === 'beauty' ? 'красота' :
           factor === 'harmony' ? 'гармония' :
           factor === 'dynamics' ? 'динамика' :
           factor === 'originality' ? 'оригинальность' :
           factor === 'accuracy' ? 'точность' : factor,
    connotation: connotation === 'positive' || connotation === 'high' ? 'положительное' :
                 connotation === 'negative' || connotation === 'low' ? 'отрицательное' : connotation
  };
  return acc;
}, {});

export const DataExport: React.FC = () => {
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
      // Получаем все результаты
      const trialsSnapshot = await getDocs(query(collection(db, 'trials')));
      const trials = trialsSnapshot.docs.map(doc => doc.data() as TrialData);

      // Сортируем по имени файла картинки
      trials.sort((a, b) => a.imageFileName.localeCompare(b.imageFileName));

      // Создаем CSV контент
      const headers = ['никнейм', 'имя файла картинки', 'время реакции', 'слово', 'фактор', 'коннотация', 'верно или ошибся'];
      const rows = trials.map(trial => {
        let factor: string;
        let connotation: string;

        switch (trial.wordType) {
          case 'target':
            factor = 'концепт';
            connotation = 'таргет';
            break;
          case 'antonym':
            factor = 'концепт';
            connotation = 'антоним';
            break;
          case 'factor':
            const factorInfo = factorWordMap[trial.word] || { factor: 'неизвестно', connotation: 'неизвестно' };
            factor = factorInfo.factor;
            connotation = factorInfo.connotation;
            break;
          case 'non-word':
            factor = 'не-слово';
            connotation = 'нейтральное';
            break;
          default:
            factor = 'неизвестно';
            connotation = 'неизвестно';
        }

        return [
          trial.participantNickname,
          trial.imageFileName,
          trial.reactionTimeMs.toString(),
          trial.word,
          factor,
          connotation,
          trial.isCorrect ? 'верно' : 'ошибка'
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      
      // Создаем и скачиваем файл
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `results_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setOpen(false);
      setPin('');
      setError(false);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setOpen(true)}
        sx={{ position: 'absolute', top: 16, right: 16 }}
      >
        Выгрузка данных
      </Button>

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
    </>
  );
}; 