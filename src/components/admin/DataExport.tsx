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
    
    console.log('Using pre-loaded model dictionary for export:', modelDictionary);
    
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
      'reactionTimeMs',
      'deviceType',
      'timestamp'
    ].join(',');

    const rows = querySnapshot.docs
      .map(doc => {
        const data = doc.data() as TrialDataFromFirestore;
        const aestheticInfo = aestheticWordMap[data.word] || { factor: '', connotation: '' };
        
        const model = modelDictionary[data.imageFileName] || 'not_found';
        
        const deviceKey = `${data.participantId}_${data.participantNickname}`;
        const deviceInfo = sessionsMap.get(deviceKey);
        const deviceType = deviceInfo ? deviceInfo.deviceType : 'desktop';

        return {
          data: [
            data.participantId || '',
            data.participantNickname || '',
            data.imageFileName || '',
            model,
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

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'experiment_results_v2.csv';
    link.click();
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