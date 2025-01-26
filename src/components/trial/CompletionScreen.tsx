import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { calculateRating } from '../../firebase/service.tsx';
import { RatingCalculation } from '../../firebase/service.tsx';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Leaderboard } from '../leaderboard/Leaderboard';

interface CompletionScreenProps {
  participant: {
    sessionId: string;
    nickname: string;
    isTestSession: boolean;
  };
  sessionStats: {
    totalTrials: number;
    correctTrials: number;
    totalTimeMs: number;
  };
  canContinue: boolean;
  onNextRound: () => void;
  completedImages?: string[];
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ participant, sessionStats, canContinue, onNextRound, completedImages }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState<RatingCalculation | null>(null);

  useEffect(() => {
    const calculateAndShowRating = async () => {
      try {
        console.log('Session stats:', sessionStats);
        const roundsCompleted = completedImages ? Math.floor(completedImages.length / 4) : 0;
        console.log('Rounds completed:', roundsCompleted);
        const rating = await calculateRating(
          sessionStats.totalTrials,
          sessionStats.correctTrials,
          sessionStats.totalTimeMs,
          roundsCompleted
        );
        console.log('Calculated rating:', rating);
        setRating(rating);
      } catch (error) {
        console.error('Error calculating rating:', error);
      }
    };

    calculateAndShowRating();
  }, [sessionStats, completedImages]);

  if (!rating) return null;
  console.log('Rendering with rating:', rating);

  const StatCard = ({ title, icon, score, maxScore, color, description }: { 
    title: string; 
    icon: React.ReactNode; 
    score: number; 
    maxScore: number;
    color: string;
    description: string;
  }) => (
    <Card sx={{ 
      width: { xs: 105, sm: 160 }, 
      height: { xs: 160, sm: 180 }, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'flex-start',
      p: { xs: 1, sm: 2 },
      pt: { xs: 2, sm: 3 },
      m: 0.5,
      position: 'relative'
    }}>
      <Box sx={{ position: 'relative', mb: 2, width: { xs: 45, sm: 60 }, height: { xs: 45, sm: 60 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={45}
          thickness={3}
          sx={{ color: 'grey.200', position: 'absolute' }}
        />
        <CircularProgress
          variant="determinate"
          value={title === "Бонус" ? bonusPercent : (isNaN(score) ? 0 : (score / maxScore) * 100)}
          size={45}
          thickness={3}
          sx={{ color, position: 'absolute' }}
        />
        <Box sx={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}>
          {React.cloneElement(icon as React.ReactElement, { 
            sx: { 
              fontSize: { xs: 24, sm: 30 },
              color: (icon as React.ReactElement).props.sx?.color 
            } 
          })}
        </Box>
      </Box>
      <Typography variant="subtitle2" align="center" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, mb: 1.5, minHeight: '1rem' }}>
        {title}
      </Typography>
      <Typography variant="h6" align="center" sx={{ color, fontSize: { xs: '1rem', sm: '1.25rem' }, mb: 1.5, minHeight: '1.5rem' }}>
        {title === "Бонус" ? `×${isNaN(score) ? '0' : Math.round(score * 100)}%` : (isNaN(score) ? '0' : score)}
      </Typography>
      <Typography 
        variant="caption" 
        align="center" 
        color="text.secondary"
        sx={{ 
          whiteSpace: 'pre-line',
          lineHeight: 1.2,
          fontSize: { xs: '0.6rem', sm: '0.75rem' },
          minHeight: '2rem'
        }}
      >
        {title === "Бонус" ? 
          `за ${rating.roundsCompleted} из ${maxBonusRounds} раундов\n(+10% за раунд)` : 
          description}
      </Typography>
    </Card>
  );

  // Вычисляем максимальный бонус за раунды (20 = 100%)
  const maxBonusRounds = 20;
  const bonusScore = Math.round((rating.roundBonus - 1) * 100);
  const bonusPercent = (rating.roundsCompleted / maxBonusRounds) * 100;

  return (
    <Box sx={{ 
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'grey.100',
      p: { xs: 2, sm: 3 }
    }}>
      <Typography variant="h5" gutterBottom align="center">
        Результаты раунда
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
        my: 2,
        flexWrap: 'nowrap'
      }}>
        <StatCard
          title="Время"
          icon={<AccessTimeIcon sx={{ fontSize: 30, color: 'primary.main' }} />}
          score={rating.timeScore}
          maxScore={15}
          color="primary.main"
          description={`из 15 баллов\n${Math.round(rating.actualTime / 1000)}с / ${Math.round(rating.theoreticalMinTime / 1000)}с`}
        />
        <StatCard
          title="Точность"
          icon={<CheckCircleIcon sx={{ fontSize: 30, color: 'success.main' }} />}
          score={Math.round(rating.accuracyMultiplier * 85)}
          maxScore={85}
          color="success.main"
          description={`из 85 баллов\n${Math.round(rating.accuracy)}% верных ответов`}
        />
        <StatCard
          title="Бонус"
          icon={<EmojiEventsIcon sx={{ fontSize: 30, color: 'warning.main' }} />}
          score={Math.round(rating.roundBonus * 100) / 100}
          maxScore={4}
          color="warning.main"
          description={`за ${rating.roundsCompleted} из ${maxBonusRounds} раундов\n(+10% за раунд)`}
        />
      </Box>

      <Typography variant="h4" align="center" sx={{ my: 3 }}>
        Счёт за раунд: {isNaN(rating.finalScore) ? '0' : rating.finalScore}
      </Typography>

      {canContinue && (
        <>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
            Пройдено раундов: {completedImages ? Math.floor(completedImages.length / 4) : 0} из 20
          </Typography>
          <Typography variant="body1" color="primary" align="center" sx={{ mb: 2 }}>
            Продолжайте играть, чтобы улучшить свой рейтинг! Каждый новый раунд увеличивает ваш бонус ещё на 10%
          </Typography>
          <Button
            variant="contained"
            onClick={onNextRound}
            fullWidth
            sx={{ mb: 3 }}
          >
            Играть ещё
          </Button>
        </>
      )}

      {!participant.isTestSession && (
        <>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <Typography variant="body1" color="text.secondary">
                Рейтинг игроков
              </Typography>
              <Tooltip title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2">
                    Как считается счёт за раунд:
                    <br/><br/>
                    • <b>Точность</b> (до 85 баллов)
                    <br/>Процент верных ответов влияет на счёт в квадрате. 
                    <br/>Пример: 90% = 0.9² × 85 ≈ 69 баллов
                    <br/><br/>
                    • <b>Время</b> (до 15 баллов)
                    <br/>Чем ближе к оптимальному времени (1.5с на слово), тем больше баллов
                    <br/><br/>
                    • <b>Бонус за раунды</b>
                    <br/>Увеличивает итоговый счёт на 10% за каждый пройденный раунд:
                    <br/>1 раунд: ×1.1, 2 раунда: ×1.2, 3 раунда: ×1.3 и т.д.
                    <br/><br/>
                    • <b>Рейтинг в таблице</b>
                    <br/>В таблице лидеров показан средний счёт по всем вашим раундам
                  </Typography>
                </Box>
              }>
                <HelpOutlineIcon 
                  sx={{ 
                    fontSize: 20,
                    color: 'text.secondary',
                    cursor: 'help'
                  }} 
                />
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Ваш результат за этот раунд повлияет на среднее значение в таблице рейтинга
            </Typography>
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

      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {!canContinue && !participant.isTestSession && (
          <Typography sx={{ mt: 2, color: 'success.main' }}>
            Поздравляем! Вы прошли все раунды. Теперь можно начать новую игру с теми же изображениями.
          </Typography>
        )}
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          fullWidth
        >
          В начало
        </Button>
      </Box>
    </Box>
  );
}; 