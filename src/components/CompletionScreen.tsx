import React, { useState } from 'react';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Leaderboard } from './leaderboard/Leaderboard';

interface CompletionScreenProps {
  participant: {
    nickname: string;
    isTestSession: boolean;
  };
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
  onStartNewSession
}) => {
  const accuracy = ((sessionStats.correctTrials / sessionStats.totalTrials) * 100).toFixed(1);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        Сессия завершена
      </Typography>

      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Ваши результаты:
        </Typography>
        <Typography variant="body1" gutterBottom>
          Правильных ответов: {sessionStats.correctTrials} из {sessionStats.totalTrials} ({accuracy}%)
        </Typography>
      </Box>

      {!participant.isTestSession && (
        <>
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Рейтинг (0-1000)
            </Typography>
            <Tooltip title="Рейтинг учитывает точность ответов и скорость выполнения. Точность выше 90% даёт значительный бонус." arrow>
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Leaderboard currentUserNickname={participant.nickname} />
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onStartNewSession}
          sx={{ minWidth: '200px' }}
        >
          Сыграть ещё
        </Button>
        {canContinue && (
          <Button
            variant="outlined"
            color="primary"
            onClick={onStartNewSession}
            sx={{ minWidth: '200px' }}
          >
            Продолжить
          </Button>
        )}
      </Box>
    </Box>
  );
}; 