import React from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Participant } from '../types';

interface CompletionScreenProps {
  participant: Participant;
  sessionStats: {
    totalTrials: number;
    correctTrials: number;
  };
  canContinue: boolean;
  onStartNewSession: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  participant,
  sessionStats,
  canContinue,
  onStartNewSession,
}) => {
  const navigate = useNavigate();
  const accuracy = (sessionStats.correctTrials / sessionStats.totalTrials) * 100;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h5" align="center" gutterBottom sx={{ mb: { xs: 2, sm: 3 } }}>
        Результаты
      </Typography>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Точность ответов:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={accuracy}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="body2" sx={{ minWidth: 45 }}>
              {accuracy.toFixed(1)}%
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Правильных ответов: {sessionStats.correctTrials} из {sessionStats.totalTrials}
          </Typography>
        </Box>

        {!canContinue && !participant.isTestSession && (
          <Typography sx={{ color: 'success.main' }}>
            Поздравляем! Вы прошли все изображения. Теперь можно начать новый круг с теми же изображениями.
          </Typography>
        )}
      </Box>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 1,
        mt: { xs: 2, sm: 3 }
      }}>
        {canContinue && (
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={onStartNewSession}
          >
            Продолжить
          </Button>
        )}
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/')}
        >
          {canContinue ? 'Закончить' : 'Начать заново'}
        </Button>
      </Box>
    </Box>
  );
}; 