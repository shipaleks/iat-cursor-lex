import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress, useTheme, useMediaQuery, Button } from '@mui/material';
import { ImageDisplay } from './ImageDisplay';
import { WordDisplay } from './WordDisplay';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Session, TrialState, ImageData } from '../../types';
import { createSession, IMAGES } from '../../utils/trialGenerator';
import { saveTrialResult, saveSessionResults, updateLeaderboard, updateParticipantProgress } from '../../firebase/service';
import { auth } from '../../firebase/config';
import { getParticipantProgress, getParticipantProgressByNickname } from '../../firebase/service';

const IMAGE_DISPLAY_TIME = 500; // ms
const FIXATION_DISPLAY_TIME = 300; // ms

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
  const [showFixation, setShowFixation] = useState(true);
  const [lastResponse, setLastResponse] = useState<{ isCorrect: boolean; button: 'left' | 'right' } | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);

  // Инициализация сессии
  useEffect(() => {
    const initSession = async () => {
      if (!participant) return;

      try {
        // Получаем прогресс участника
        let completedImages = new Set<string>();
        if (!participant.isTestSession) {
          const progressData = await getParticipantProgressByNickname(participant.nickname);
          if (progressData) {
            completedImages = new Set(progressData.progress.completedImages);
          }
        }

        // Создаем новую сессию
        const session = await createSession(completedImages);
        setSession(session);
        
        // Если это не тестовая сессия, сохраняем прогресс
        if (!participant.isTestSession) {
          await updateParticipantProgress(participant.nickname, {
            completedImages: Array.from(completedImages)
          });
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();
  }, [participant]);

  const handleResponse = async (isWord: boolean) => {
    if (!session || !trialState || trialState.showImage || showFixation || isProcessingResponse) return;

    setIsProcessingResponse(true);
    
    const currentTrial = session.trials[session.currentTrialIndex];
    const reactionTime = Date.now() - (trialState.startTime || 0);
    const isCorrect = (isWord && currentTrial.wordType !== 'non-word') || 
                     (!isWord && currentTrial.wordType === 'non-word');

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
          participant.nickname,
          {
            totalTrials: session.trials.length,
            correctTrials: finalCorrectAnswers,
            totalTimeMs: totalTime
          }
        );

        // Обновляем прогресс участника - сохраняем только уникальные imageId
        const completedImages = [...new Set(session.trials.map(t => t.imageId))].map(id => {
          const image = IMAGES.find(img => img.id === id);
          return image ? image.fileName : '';
        }).filter(Boolean);

        console.log('Saving completed images:', completedImages);
        
        await updateParticipantProgress(
          participant.nickname,
          {
            completedImages: completedImages
          }
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

      // Показываем фиксационный крест и готовим следующее испытание
      setShowFixation(true);
      setIsProcessingResponse(false);
      
      // Обновляем состояние испытания
      setTrialState({
        trial: nextTrial,
        image: nextImage,
        showImage: false,
        showWord: false,
        lastResponse: null,
        startTime: null
      });

      // Сбрасываем lastResponse через 500мс
      setTimeout(() => {
        setLastResponse(null);
      }, 500);
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

  // Управление показом фиксации, изображения и слова
  useEffect(() => {
    if (!session || !trialState) return;

    if (showFixation) {
      const timer = setTimeout(() => {
        setShowFixation(false);
        setTrialState(prev => ({
          ...prev!,
          showImage: true,
          startTime: Date.now(),
        }));
      }, FIXATION_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }

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
  }, [showFixation, trialState?.showImage, session]);

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
        showImage: false,
        showWord: false,
        lastResponse: null,
        startTime: null
      });
      setShowFixation(true);
    }
  }, [session, trialState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  if (!session || !trialState) {
    return <Typography>Загрузка...</Typography>;
  }

  const progress = (session.currentTrialIndex / session.trials.length) * 100;

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Прогресс бар */}
      <Box
        sx={{
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 4, borderRadius: 1 }}
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
          justifyContent: 'center'
        }}
      >
        {showFixation ? (
          <Typography variant="h5" sx={{ color: 'text.primary' }}>
            +
          </Typography>
        ) : trialState.showImage ? (
          <ImageDisplay imageUrl={trialState.image.url} />
        ) : (
          <Typography variant="h6" sx={{ fontSize: { xs: '24px', sm: '28px' } }}>
            {trialState.trial.word}
          </Typography>
        )}
      </Box>

      {/* Кнопки */}
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
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