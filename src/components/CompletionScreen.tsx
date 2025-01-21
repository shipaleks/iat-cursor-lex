import React from 'react';
import { Box, Typography, Button, LinearProgress, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Participant } from '../types';
import { Leaderboard } from './leaderboard/Leaderboard';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" align="center" gutterBottom>
          Результаты
        </Typography>

        <Box sx={{ mb: 3 }}>
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

        {!participant.isTestSession && (
          <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body1" color="text.secondary">
                Рейтинг (0-100)
              </Typography>
              <Tooltip title="Рейтинг учитывает точность ответов и скорость выполнения. Точность выше 90% даёт значительный бонус." arrow>
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Leaderboard currentUserNickname={participant.nickname} />
          </>
        )}

        {!canContinue && !participant.isTestSession && (
          <Typography sx={{ mt: 2, color: 'success.main' }}>
            Поздравляем! Вы прошли все изображения. Теперь можно начать новый круг с теми же изображениями.
          </Typography>
        )}
      </Box>

      <Box sx={{ 
        p: { xs: 2, sm: 3 },
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
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