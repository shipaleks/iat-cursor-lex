import { useState, useEffect } from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import { calculateRating, type RatingCalculation } from '../../firebase/service';

interface CompletionScreenProps {
  accuracy: number;
  totalTimeMs: number;
  totalTrials: number;
  correctTrials: number;
  completedImages: string[];
  onContinue: () => void;
  onExit: () => void;
}

export default function CompletionScreen({
  accuracy,
  totalTimeMs,
  totalTrials,
  correctTrials,
  completedImages,
  onContinue,
  onExit
}: CompletionScreenProps) {
  const [ratingDetails, setRatingDetails] = useState<RatingCalculation | null>(null);
  const [showTimeScore, setShowTimeScore] = useState(false);
  const [showAccuracyPenalty, setShowAccuracyPenalty] = useState(false);
  const [showRoundMultiplier, setShowRoundMultiplier] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    // Загружаем детали рейтинга
    const uniqueImagesCount = new Set(completedImages.map(img => img.split('_')[0])).size;
    const completedRounds = Math.floor(uniqueImagesCount / 4);
    
    calculateRating(totalTrials, correctTrials, totalTimeMs, completedRounds).then(details => {
      setRatingDetails(details);
      
      // Анимируем показ компонентов
      setTimeout(() => {
        setShowTimeScore(true);
        setCurrentScore(details.timeScore);
      }, 1000);

      setTimeout(() => {
        setShowAccuracyPenalty(true);
        setCurrentScore(Math.round(details.timeScore * details.accuracyMultiplier));
      }, 3000);

      setTimeout(() => {
        setShowRoundMultiplier(true);
        setCurrentScore(details.finalScore);
      }, 5000);
    });
  }, [totalTrials, correctTrials, totalTimeMs, completedImages]);

  if (!ratingDetails) {
    return <Box sx={{ p: 3 }}><LinearProgress /></Box>;
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      p: 3,
      bgcolor: 'grey.100'
    }}>
      <Typography variant="h5" align="center">
        Результаты раунда
      </Typography>

      <Typography variant="h4" align="center" sx={{ 
        transition: 'all 0.5s ease-in-out',
        color: showRoundMultiplier ? 'success.main' : 'text.primary'
      }}>
        {currentScore}
      </Typography>

      {showTimeScore && (
        <Box>
          <Typography variant="subtitle1">
            1. Скорость реакции
          </Typography>
          <Box sx={{ mt: 1, mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(ratingDetails.actualTime / ratingDetails.theoreticalMinTime) * 100}
              sx={{
                height: 10,
                bgcolor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main'
                }
              }}
            />
          </Box>
          <Typography>
            Базовый балл: {ratingDetails.timeScore}
          </Typography>
        </Box>
      )}

      {showAccuracyPenalty && (
        <Box>
          <Typography variant="subtitle1">
            2. Штраф за ошибки
          </Typography>
          <Typography>
            Точность: {ratingDetails.accuracy.toFixed(1)}%
          </Typography>
          <Typography sx={{ color: ratingDetails.accuracyMultiplier < 1 ? 'error.main' : 'success.main' }}>
            Множитель: ×{ratingDetails.accuracyMultiplier.toFixed(2)}
          </Typography>
          <Typography>
            Балл после штрафа: {Math.round(ratingDetails.timeScore * ratingDetails.accuracyMultiplier)}
          </Typography>
        </Box>
      )}

      {showRoundMultiplier && (
        <Box>
          <Typography variant="subtitle1">
            3. Множитель за раунды
          </Typography>
          <Typography>
            Пройдено раундов: {Math.floor(new Set(completedImages.map(img => img.split('_')[0])).size / 4)}
          </Typography>
          <Typography sx={{ color: 'success.main' }}>
            Множитель: ×{ratingDetails.roundBonus.toFixed(2)}
          </Typography>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>
            Следующий раунд: ×{(ratingDetails.roundBonus + 0.2).toFixed(2)}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
        <Button
          variant="contained"
          onClick={onContinue}
          sx={{ minWidth: 120 }}
        >
          Ещё раунд?
        </Button>
        <Button
          variant="outlined"
          onClick={onExit}
          sx={{ minWidth: 120 }}
        >
          В начало
        </Button>
      </Box>
    </Box>
  );
} 