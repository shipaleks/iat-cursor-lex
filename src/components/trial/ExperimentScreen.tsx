import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress, useTheme, useMediaQuery, Button, CircularProgress } from '@mui/material';
import { ImageDisplay } from './ImageDisplay';
import { WordDisplay } from './WordDisplay';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Session, TrialState, ImageData } from '../../types';
import { createSession, IMAGES } from '../../utils/trialGenerator';
import { saveTrialResult, saveSessionResults, updateLeaderboard, updateParticipantProgress } from '../../firebase/service.tsx';
import { auth } from '../../firebase/config.tsx';
import { getParticipantProgress, getParticipantProgressByNickname } from '../../firebase/service.tsx';

const IMAGE_DISPLAY_TIME = 1000; // ms

interface ExperimentScreenProps {
  participant: { 
    sessionId: string; 
    nickname: string;
    isTestSession: boolean;
  };
  onComplete: (stats: { correct: number; total: number; totalTimeMs: number }) => void;
}

export const ExperimentScreen: React.FC<ExperimentScreenProps> = ({ participant, onComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [trialState, setTrialState] = useState<TrialState | null>(null);
  const [lastResponse, setLastResponse] = useState<{ isCorrect: boolean; button: 'left' | 'right' } | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [wordColor, setWordColor] = useState<'default' | 'success.main' | 'error.main'>('default');

  // Инициализация сессии
  useEffect(() => {
    const initSession = async () => {
      if (!participant || !auth.currentUser) return;

      try {
        const progress = await getParticipantProgress(auth.currentUser.uid);
        const completedImages = progress?.completedImages || [];
        
        // Создаем новую сессию с правильным количеством аргументов
        const session = await createSession(
          participant.sessionId,
          completedImages,
          participant.isTestSession
        );
        
        if (!session) {
          throw new Error('Failed to create session');
        }

        setSession(session);
        
        // Если это не тестовая сессия, сохраняем прогресс
        if (!participant.isTestSession) {
          await updateParticipantProgress(
            auth.currentUser.uid,
            participant.nickname,
            Array.from(completedImages)
          );
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();
  }, [participant]);

  const handleResponse = async (isWord: boolean) => {
    if (!session || !trialState || trialState.showImage || isProcessingResponse) return;

    setIsProcessingResponse(true);
    
    const currentTrial = session.trials[session.currentTrialIndex];
    const reactionTime = Date.now() - (trialState.startTime || 0);
    const isCorrect = (isWord && currentTrial.wordType !== 'non-word') || 
                     (!isWord && currentTrial.wordType === 'non-word');

    // Устанавливаем цвет в зависимости от правильности ответа
    setWordColor(isCorrect ? 'success.main' : 'error.main');
    
    // Ждем 300мс для отображения цвета
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Сбрасываем цвет и скрываем слово
    setWordColor('default');

    // Save trial result to Firebase only for non-test sessions
    if (auth.currentUser && !participant.isTestSession) {
      await saveTrialResult({
        participantId: auth.currentUser.uid,
        participantNickname: participant.nickname,
        imageFileName: currentTrial.imageId,
        word: currentTrial.word,
        wordType: currentTrial.wordType,
        isCorrect,
        reactionTimeMs: reactionTime
      });
    }

    setLastResponse({
      isCorrect: isCorrect,
      button: isWord ? 'left' : 'right'
    });
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    // Переходим к следующему испытанию
    const nextTrialIndex = session.currentTrialIndex + 1;
    
    if (nextTrialIndex >= session.trials.length) {
      const totalTime = Date.now() - sessionStartTime;
      const finalCorrectAnswers = correctAnswers + (isCorrect ? 1 : 0);
      
      if (auth.currentUser && !participant.isTestSession) {
        // Сохраняем результаты сессии
        await saveSessionResults(
          auth.currentUser.uid,
          session.trials.length,
          finalCorrectAnswers,
          totalTime,
          participant.nickname
        );

        // Обновляем таблицу лидеров
        await updateLeaderboard(
          auth.currentUser.uid,
          participant.nickname,
          session.trials.length,
          finalCorrectAnswers,
          totalTime
        );

        // Получаем только уникальные изображения для текущего раунда
        const uniqueCompletedImages = [...new Set(session.trials
          .map(t => {
            const image = IMAGES.find(img => img.id === t.imageId);
            return image?.fileName;
          })
          .filter((fileName): fileName is string => fileName !== undefined && fileName !== null))];

        // Получаем текущий прогресс
        const currentProgress = await getParticipantProgress(auth.currentUser.uid);
        console.log('Current progress from Firebase:', currentProgress);

        // Проверяем, что изображения из текущего раунда еще не были пройдены
        const existingImages = currentProgress?.completedImages || [];
        console.log('Existing completed images:', existingImages);

        // Фильтруем только новые изображения из текущего раунда
        const newImages = uniqueCompletedImages.filter(img => !existingImages.includes(img));
        console.log('New images to add:', newImages);

        // Объединяем с уже пройденными изображениями
        const allCompletedImages = [...existingImages, ...newImages];
        console.log('All completed images after merge:', allCompletedImages);

        await updateParticipantProgress(
          auth.currentUser.uid,
          participant.nickname,
          allCompletedImages
        );
      }
      
      onComplete({
        correct: finalCorrectAnswers,
        total: session.trials.length,
        totalTimeMs: totalTime
      });
      navigate('/completion');
    } else {
      // Обновляем сессию и готовим следующее испытание
      const nextTrial = session.trials[nextTrialIndex];
      const nextImage = IMAGES.find(img => img.id === nextTrial.imageId)!;

      setSession(prev => prev ? {
        ...prev,
        currentTrialIndex: nextTrialIndex,
        completedTrials: prev.completedTrials + 1
      } : null);

      // Обновляем состояние испытания
      setTrialState({
        trial: nextTrial,
        image: nextImage,
        showImage: true,
        showWord: false,
        lastResponse: null,
        startTime: null
      });

      // Сбрасываем lastResponse через 500мс
      setTimeout(() => {
        setLastResponse(null);
      }, 500);

      // Разрешаем новые ответы
      setIsProcessingResponse(false);
    }
  };

  // Обработка нажатий клавиш
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      handleResponse(true); // СЛОВО
    } else if (event.key === 'ArrowRight') {
      handleResponse(false); // НЕ СЛОВО
    }
  }, [handleResponse]);

  // Управление показом изображения и слова
  useEffect(() => {
    if (!session || !trialState) return;

    if (trialState.showImage) {
      const timer = setTimeout(() => {
        setTrialState(prev => ({
          ...prev!,
          showImage: false,
          startTime: Date.now(),
        }));
      }, IMAGE_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }
  }, [trialState?.showImage, session]);

  // Инициализация первого испытания
  useEffect(() => {
    if (session && !trialState) {
      console.log('Initializing first trial');
      const firstTrial = session.trials[0];
      const firstImage = IMAGES.find(img => img.id === firstTrial.imageId)!;
      
      console.log('First trial:', firstTrial);
      console.log('First image:', firstImage);
      
      setTrialState({
        trial: firstTrial,
        image: firstImage,
        showImage: true,
        showWord: false,
        lastResponse: null,
        startTime: null
      });
    }
  }, [session, trialState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (!session || !trialState) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 3,
          p: 3,
          bgcolor: 'grey.200'
        }}
      >
        <CircularProgress
          size={56}
          thickness={4}
          sx={{
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            color="text.primary"
            gutterBottom
            sx={{
              fontWeight: 500,
              letterSpacing: 0.5
            }}
          >
            Подготовка раунда
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              maxWidth: 300,
              mx: 'auto',
              animation: 'fadeInOut 2s infinite',
              '@keyframes fadeInOut': {
                '0%': { opacity: 0.5 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.5 }
              }
            }}
          >
            Загрузка изображений...
          </Typography>
        </Box>
      </Box>
    );
  }

  const progress = (session.currentTrialIndex / session.trials.length) * 100;

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: 'grey.200'
      }}
    >
      {/* Прогресс бар */}
      <Box
        sx={{
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.100'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ 
                height: 4, 
                borderRadius: 1,
                bgcolor: 'grey.300',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'primary.main'
                }
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, fontSize: 12 }}>
            {session.currentTrialIndex + 1}/{session.trials.length}
          </Typography>
        </Box>
      </Box>

      {/* Основной контент */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100'
        }}
      >
        {trialState.showImage ? (
          <ImageDisplay imageUrl={trialState.image.url} />
        ) : (
          <Typography 
            variant="h4" 
            sx={{ 
              fontSize: { xs: '28px', sm: '32px' },
              transition: 'color 0.2s ease',
              color: wordColor
            }}
          >
            {trialState.trial.word}
          </Typography>
        )}
      </Box>

      {/* Кнопки */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'grey.100',
          display: 'flex',
          gap: 1,
          p: 1
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          startIcon={<KeyboardArrowLeft />}
          onClick={() => handleResponse(true)}
          sx={{
            height: { xs: 56, sm: 'auto' },
            color: lastResponse?.button === 'left' 
              ? (lastResponse.isCorrect ? 'success.main' : 'error.main')
              : 'inherit',
            borderColor: lastResponse?.button === 'left'
              ? (lastResponse.isCorrect ? 'success.main' : 'error.main')
              : 'inherit',
            transition: 'none',
            '&:hover': {
              borderColor: lastResponse?.button === 'left'
                ? (lastResponse.isCorrect ? 'success.main' : 'error.main')
                : 'inherit',
              transition: 'none'
            },
            '& .MuiTouchRipple-root': {
              display: 'none'
            }
          }}
        >
          Слово
        </Button>
        <Button
          variant="outlined"
          fullWidth
          endIcon={<KeyboardArrowRight />}
          onClick={() => handleResponse(false)}
          sx={{
            height: { xs: 56, sm: 'auto' },
            color: lastResponse?.button === 'right'
              ? (lastResponse.isCorrect ? 'success.main' : 'error.main')
              : 'inherit',
            borderColor: lastResponse?.button === 'right'
              ? (lastResponse.isCorrect ? 'success.main' : 'error.main')
              : 'inherit',
            transition: 'none',
            '&:hover': {
              borderColor: lastResponse?.button === 'right'
                ? (lastResponse.isCorrect ? 'success.main' : 'error.main')
                : 'inherit',
              transition: 'none'
            },
            '& .MuiTouchRipple-root': {
              display: 'none'
            }
          }}
        >
          Не слово
        </Button>
      </Box>
    </Box>
  );
}; 