import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { calculateRating, getParticipantProgress } from '../../firebase/service.tsx';
import { RatingCalculation, Participant as ParticipantType, TrialResult, LeaderboardEntry as LeaderboardEntryType } from '../../types';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Leaderboard } from '../leaderboard/Leaderboard';
import { auth } from '../../firebase/config.tsx';

interface CompletionScreenProps {
  participant: {
    sessionId: string;
    nickname: string;
    isTestSession: boolean;
    userId: string;
  };
  sessionStats: {
    totalTrials: number;
    correctTrials: number;
    totalTimeMs: number;
  };
  onNextRound: () => void;
  completedImages?: string[];
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({ participant, sessionStats, onNextRound, completedImages }) => {
  const navigate = useNavigate();
  const [rating, setRating] = useState<RatingCalculation | null>(null);
  const [refreshTime, setRefreshTime] = useState(Date.now()); // Для принудительного обновления

  // Функция для обновления данных рейтинга
  const refreshRating = () => {
    console.log('[CompletionScreen] Refreshing rating data');
    setRefreshTime(Date.now());
  };

  // Периодическое обновление данных
  useEffect(() => {
    const interval = setInterval(() => {
      refreshRating();
    }, 2000); // Обновляем каждые 2 секунды
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const calculateAndShowRating = async () => {
      try {
        console.log('[CompletionScreen] Calculating rating, stats:', sessionStats);
        console.log('[CompletionScreen] Completed images:', {
          имеется: completedImages !== undefined,
          длина: completedImages?.length || 0,
          примерСодержимого: completedImages?.slice(0, 3)
        });
        
        // Получаем информацию о прогрессе пользователя из Firebase
        let roundsCompleted = 1; // Начинаем с 1
        
        if (participant && participant.userId) {
          try {
            const progress = await getParticipantProgress(participant.userId);
            if (progress && progress.totalSessions) {
              roundsCompleted = Math.max(1, progress.totalSessions);
              console.log(`[CompletionScreen] РАСЧЕТ РАУНДОВ НА ФИНАЛЬНОМ ЭКРАНЕ:`);
              console.log(`  - ID пользователя: ${participant.userId}`);
              console.log(`  - Никнейм: ${participant.nickname}`);
              console.log(`  - Количество сессий в БД: ${progress.totalSessions}`);
              console.log(`  - Итоговый номер раунда: ${roundsCompleted}`);
            }
          } catch (error) {
            console.error('[CompletionScreen] Ошибка при получении прогресса:', error);
          }
        }
        
        const rating = await calculateRating(
          sessionStats.totalTrials,
          sessionStats.correctTrials,
          sessionStats.totalTimeMs,
          roundsCompleted
        );
        console.log('[CompletionScreen] Полученный рейтинг от сервера:', JSON.stringify(rating, null, 2));
        setRating(rating);
      } catch (error) {
        console.error('[CompletionScreen] Ошибка при расчете рейтинга:', error);
      }
    };

    calculateAndShowRating();
  }, [sessionStats, completedImages, participant, refreshTime]); // Добавляем refreshTime зависимость

  if (!rating) return null;
  console.log('Отображение с рейтингом:', rating);

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
      position: 'relative',
      bgcolor: 'background.paper',
      boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <Box sx={{ position: 'relative', mb: 2, width: { xs: 45, sm: 60 }, height: { xs: 45, sm: 60 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={45}
          thickness={3}
          sx={{ color: 'grey.800', position: 'absolute' }}
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
        {title === "Бонус" ? `×${Math.round(score * 100)}%` : (isNaN(score) ? '0' : score)}
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
          `Раунд ${rating.roundsCompleted}\n(+${(rating.roundsCompleted - 1) * 5}%)` : 
          description}
      </Typography>
    </Card>
  );

  // Вычисляем максимальный бонус за раунды
  const maxBonusRounds = 20;
  const bonusPercent = Math.min(100, rating.roundsCompleted * 5); // 20 раундов = 100%

  // Вычисление процента для прогресс-бара бонуса (остается как есть, но для информации)
  const bonusPercentForProgress = Math.min(100, (rating.bonusPercentage - 100) / 1.25); // ( тек_бонус - 100 ) / 125 * 100

  return (
    <Box sx={{ 
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default',
      p: { xs: 2, sm: 3 }
    }}>
      <Typography variant="h5" gutterBottom align="center" color="text.primary">
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
          description={`${sessionStats.correctTrials} из ${sessionStats.totalTrials} (${Math.round(rating.accuracy)}%)`}
        />
        <StatCard
          title="Бонус"
          icon={<EmojiEventsIcon sx={{ fontSize: 30, color: 'warning.main' }} />}
          score={rating.roundBonus}
          maxScore={3}
          color="warning.main"
          description={`Раунд ${rating.roundsCompleted}\n(+${(rating.roundsCompleted - 1) * 5}%)`}
        />
      </Box>

      <Typography variant="h4" align="center" sx={{ my: 3 }}>
        Счёт за раунд: {isNaN(rating.finalScore) ? '0' : rating.finalScore}
      </Typography>

      {participant.isTestSession ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, my: 3 }}>
          <Typography variant="h6" color="primary" align="center">
            Вы завершили тестовый раунд! 🎉
          </Typography>
          <Typography color="text.secondary" align="center">
            Теперь вы можете начать настоящую игру, результаты которой будут записаны
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 1 }}>
            Пройдено раундов: {rating.roundsCompleted} из 25
          </Typography>
          
          <Typography variant="body1" color="primary" align="center" sx={{ mb: 2 }}>
            Продолжайте играть, чтобы увеличить бонус! С каждым новым раундом ваш бонус растёт на 5% (до 25 раунда)
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
                    <br/>Увеличивает итоговый счёт на 5% за каждый пройденный раунд (максимум 25 раундов, +125%):
                    <br/>1 раунд: ×1.05 (105%), 2 раунда: ×1.10 (110%), ..., 25+ раундов: ×2.25 (225%)
                    <br/><br/>
                    • <b>Сбалансированная точность</b>
                    <br/>В таблице лидеров показана сбалансированная точность (среднее между точностью на словах и не-словах).
                    <br/>Эта метрика может отличаться от простой точности (правильные/всего) показанной в карточке.
                    <br/>Например, если всегда нажимать "Слово", сбалансированная точность будет ≈50% (100% на словах, 0% на не-словах).
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
            currentUserNickname={participant.nickname.toLowerCase()} 
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
        <Button
          variant="outlined"
          onClick={() => window.location.href = '/'}
          fullWidth
        >
          {participant.isTestSession ? 'Начать игру' : 'В начало'}
        </Button>
      </Box>
    </Box>
  );
}; 