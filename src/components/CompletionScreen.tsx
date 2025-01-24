import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, LinearProgress, IconButton, Tooltip, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Participant } from '../types';
import { Leaderboard } from './leaderboard/Leaderboard';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { IMAGES } from '../utils/trialGenerator';
import { calculateRating, type RatingCalculation } from '../firebase/service.tsx';

interface CompletionScreenProps {
  participant: Participant;
  sessionStats: {
    totalTrials: number;
    correctTrials: number;
    totalTimeMs: number;
  };
  canContinue: boolean;
  onStartNewSession: () => void;
  completedImages?: string[];
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  participant,
  sessionStats,
  canContinue,
  onStartNewSession,
  completedImages = []
}) => {
  const navigate = useNavigate();
  const [ratingDetails, setRatingDetails] = useState<RatingCalculation | null>(null);
  const [showTimeScore, setShowTimeScore] = useState(false);
  const [showAccuracyScore, setShowAccuracyScore] = useState(false);
  const [showRoundMultiplier, setShowRoundMultiplier] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateAndShowRating = async () => {
      try {
        // Локальный расчет рейтинга
        const theoreticalMinTime = sessionStats.totalTrials * 1500;
        const timeRatio = theoreticalMinTime / sessionStats.totalTimeMs;
        
        // Отладочный вывод
        console.log('Completed images:', completedImages);
        
        // Считаем количество уникальных раундов
        // Каждый раунд состоит из 4 изображений, начиная с 0
        // Например: раунд 1 = изображения 0,1,2,3; раунд 2 = 4,5,6,7 и т.д.
        const uniqueImagesCount = new Set(completedImages.map(img => img.split('_')[0])).size;
        const uniqueRounds = Math.floor(uniqueImagesCount / 4);
        const currentRoundNumber = uniqueRounds; // Убираем +1
        
        console.log('Rounds calculation:', {
          completedImagesLength: completedImages?.length,
          uniqueRounds,
          currentRoundNumber
        });
        
        const localRating = {
          timeScore: Math.round(15 * Math.min(timeRatio, 1)),
          accuracyMultiplier: sessionStats.correctTrials / sessionStats.totalTrials,
          roundBonus: 1 + (currentRoundNumber - 1) * 0.2,
          finalScore: 0,
          theoreticalMinTime,
          actualTime: sessionStats.totalTimeMs,
          accuracy: (sessionStats.correctTrials / sessionStats.totalTrials) * 100,
          roundsCompleted: currentRoundNumber
        };
        
        localRating.finalScore = Math.round(
          (localRating.timeScore + (localRating.accuracyMultiplier * 85)) * 
          localRating.roundBonus
        );

        if (!participant.isTestSession) {
          try {
            // Пробуем получить рейтинг с сервера
            const details = await calculateRating(
              sessionStats.totalTrials,
              sessionStats.correctTrials,
              sessionStats.totalTimeMs,
              currentRoundNumber
            );
            setRatingDetails(details);
            setCurrentScore(details.finalScore);
            setError(null);
          } catch (err) {
            console.error('Error calculating rating:', err);
            setRatingDetails(localRating);
            setCurrentScore(localRating.finalScore);
            setError('Возникли проблемы с подключением к серверу. Результаты сохранятся позже.');
          }
        } else {
          // Для тестовой сессии используем локальный расчет
          setRatingDetails(localRating);
          setCurrentScore(localRating.finalScore);
        }

        // Показываем все блоки сразу
        setTimeout(() => {
          setShowTimeScore(true);
          setCurrentScore(localRating.timeScore);
        }, 1000);

        setTimeout(() => {
          setShowAccuracyScore(true);
          setCurrentScore(Math.round(localRating.timeScore * localRating.accuracyMultiplier));
        }, 3000);

        setTimeout(() => {
          setShowRoundMultiplier(true);
          setCurrentScore(localRating.finalScore);
        }, 5000);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Произошла ошибка при расчете результатов.');
      }
    };

    calculateAndShowRating();
  }, [participant.isTestSession, sessionStats, completedImages]);

  const accuracy = (sessionStats.correctTrials / sessionStats.totalTrials) * 100;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        bgcolor: 'grey.100'
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="h5" align="center" gutterBottom>
          {participant.isTestSession ? 'Результаты тренировки' : 'Результаты раунда'}
        </Typography>

        {ratingDetails && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h2" align="center" sx={{ 
              mb: 4,
              color: 'success.main',
              fontWeight: 'bold'
            }}>
              {currentScore}
            </Typography>

            {showTimeScore && (
              <Box sx={{ 
                mt: 3,
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                boxShadow: 1
              }}>
                <Typography variant="h6" gutterBottom>
                  1. Общее время
                </Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((ratingDetails.actualTime / ratingDetails.theoreticalMinTime) * 100, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'primary.main',
                        borderRadius: 1
                      }
                    }}
                  />
                </Box>
                <Typography variant="body1" gutterBottom>
                  {ratingDetails.timeScore} из 15 баллов
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Время: {Math.round(ratingDetails.actualTime / 1000)} сек.
                  {ratingDetails.actualTime > ratingDetails.theoreticalMinTime ? 
                    ` (идеальное время: ${Math.round(ratingDetails.theoreticalMinTime / 1000)} сек.)` : 
                    ' — отличный результат!'}
                </Typography>
              </Box>
            )}

            {showAccuracyScore && (
              <Box sx={{ 
                mt: 3,
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                boxShadow: 1
              }}>
                <Typography variant="h6" gutterBottom>
                  2. Точность
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {ratingDetails.accuracy.toFixed(1)}% правильных ответов
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {Math.round(ratingDetails.accuracyMultiplier * 85)} из 85 баллов
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {ratingDetails.accuracy >= 95 ? 
                    'Превосходная точность! Получен дополнительный бонус.' :
                    ratingDetails.accuracy >= 80 ? 
                    'Хорошая точность. Старайтесь отвечать ещё точнее для максимальных баллов.' :
                    'Постарайтесь улучшить точность ответов в следующем раунде.'}
                </Typography>
              </Box>
            )}

            {showRoundMultiplier && (
              <Box sx={{ 
                mt: 3,
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                boxShadow: 1
              }}>
                <Typography variant="h6" gutterBottom>
                  3. Бонус за раунды
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Пройдено раундов: {ratingDetails.roundsCompleted}
                </Typography>
                <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  Множитель ×{ratingDetails.roundBonus.toFixed(2)}
                </Typography>
                {ratingDetails.roundsCompleted < 10 && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    Базовый счёт {Math.round(ratingDetails.timeScore + (ratingDetails.accuracyMultiplier * 85))} × {ratingDetails.roundBonus.toFixed(2)} = {ratingDetails.finalScore}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}

        {!participant.isTestSession && (
          <>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body1" color="text.secondary">
                Рейтинг игроков
              </Typography>
              <Tooltip title="Оценка учитывает общее время (до 15 баллов) и точность ответов (до 85 баллов). Бонус за раунды будет улучшаться с каждым пройденным раундом (+20%)." arrow>
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Leaderboard 
              currentUserNickname={participant.nickname} 
              sx={{
                '.current-user': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }}
            />
          </>
        )}

        {!canContinue && !participant.isTestSession && (
          <Typography sx={{ mt: 2, color: 'success.main' }}>
            Поздравляем! Вы прошли все раунды. Теперь можно начать новую игру с теми же изображениями.
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
        gap: 1,
        bgcolor: 'grey.100'
      }}>
        {canContinue && (
          <Button
            variant="contained"
            color="primary"
            onClick={onStartNewSession}
            disabled={!canContinue}
            sx={{ boxShadow: 0 }}
          >
            {canContinue ? 'Новый раунд' : 'Все раунды пройдены'}
          </Button>
        )}
        {canContinue && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Пройдено раундов: {completedImages ? Math.floor(completedImages.length / 4) : 0} из 20
          </Typography>
        )}
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/')}
        >
          {canContinue ? 'Выйти из игры' : 'В начало'}
        </Button>
      </Box>
    </Box>
  );
}; 