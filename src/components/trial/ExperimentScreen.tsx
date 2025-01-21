import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress, useTheme, useMediaQuery, Button } from '@mui/material';
import { ImageDisplay } from './ImageDisplay';
import { WordDisplay } from './WordDisplay';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Session, TrialState, ImageData } from '../../types';
import { createSession } from '../../utils/trialGenerator';
import { saveTrialResult, saveSessionResults, updateLeaderboard, updateParticipantProgress } from '../../firebase/service';
import { auth } from '../../firebase/config';
import { getParticipantProgress, getParticipantProgressByNickname } from '../../firebase/service';

// Временные моковые данные
export const MOCK_IMAGES: ImageData[] = [
  {
    id: '1',
    fileName: 'circle1.svg',
    url: '/images/circle1.svg',
    target: 'круг',
    antonym: 'квадрат'
  },
  {
    id: '2',
    fileName: 'square1.svg',
    url: '/images/square1.svg',
    target: 'квадрат',
    antonym: 'круг'
  },
  {
    id: '3',
    fileName: 'triangle1.svg',
    url: '/images/triangle1.svg',
    target: 'треугольник',
    antonym: 'круг'
  },
  {
    id: '4',
    fileName: 'star1.svg',
    url: '/images/star1.svg',
    target: 'звезда',
    antonym: 'спираль'
  },
  {
    id: '5',
    fileName: 'spiral1.svg',
    url: '/images/spiral1.svg',
    target: 'спираль',
    antonym: 'звезда'
  },
  {
    id: '6',
    fileName: 'hexagon1.svg',
    url: '/images/hexagon1.svg',
    target: 'шестиугольник',
    antonym: 'овал'
  },
  {
    id: '7',
    fileName: 'oval1.svg',
    url: '/images/oval1.svg',
    target: 'овал',
    antonym: 'ромб'
  },
  {
    id: '8',
    fileName: 'rhombus1.svg',
    url: '/images/rhombus1.svg',
    target: 'ромб',
    antonym: 'крест'
  },
  {
    id: '9',
    fileName: 'cross1.svg',
    url: '/images/cross1.svg',
    target: 'крест',
    antonym: 'стрелка'
  },
  {
    id: '10',
    fileName: 'arrow1.svg',
    url: '/images/arrow1.svg',
    target: 'стрелка',
    antonym: 'шестиугольник'
  }
];

const IMAGE_DISPLAY_TIME = 500; // ms
const FIXATION_DISPLAY_TIME = 300; // ms уменьшаем время показа фиксации

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
  const [lastResponse, setLastResponse] = useState<'correct' | 'incorrect' | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);

  // Инициализация сессии
  useEffect(() => {
    const initSession = async () => {
      console.log('Initializing session for participant:', participant);
      
      if (!auth.currentUser) {
        console.error('No authenticated user');
        navigate('/');
        return;
      }

      // Получаем прогресс участника только для не тестовых сессий
      let completedImages = new Set<string>();
      if (!participant.isTestSession) {
        // Получаем прогресс по никнейму вместо uid
        const progressData = await getParticipantProgressByNickname(participant.nickname);
        if (progressData) {
          console.log('Participant progress:', progressData.progress);
          completedImages = new Set(progressData.progress.completedImages);
        }
      }

      // Создаем новую сессию с учетом пройденных изображений
      const newSession = createSession(
        participant.sessionId,
        MOCK_IMAGES,
        completedImages,
        2 // Пока оставляем 2 картинки для тестирования
      );
      
      if (!newSession) {
        console.error('Failed to create session');
        navigate('/completion');
        return;
      }

      console.log('Session created:', newSession);
      setSession(newSession);
    };

    initSession();
  }, [participant.sessionId, navigate]);

  const handleResponse = async (isWord: boolean) => {
    if (!session || !trialState || trialState.showImage || showFixation || isProcessingResponse) return;

    setIsProcessingResponse(true);
    
    const currentTrial = session.trials[session.currentTrialIndex];
    const reactionTime = Date.now() - trialState.wordStartTime;
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

    setLastResponse(isCorrect ? 'correct' : 'incorrect');
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }

    // Обновляем результат текущего испытания
    const updatedTrials = [...session.trials];
    updatedTrials[session.currentTrialIndex] = {
      ...currentTrial,
      reactionTime,
      isCorrect,
    };

    // Переходим к следующему испытанию
    const nextTrialIndex = session.currentTrialIndex + 1;
    
    if (nextTrialIndex >= session.trials.length) {
      setSession(prev => prev ? { ...prev, completed: true } : null);
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

        // Обновляем прогресс участника по никнейму
        const completedImages = [...new Set(session.trials.map(t => t.imageId))];
        const existingProgress = await getParticipantProgressByNickname(participant.nickname);
        
        if (existingProgress) {
          // Обновляем существующий прогресс
          await updateParticipantProgress(
            existingProgress.userId,
            participant.nickname,
            completedImages
          );
        } else {
          // Создаем новый прогресс
          await updateParticipantProgress(
            auth.currentUser.uid,
            participant.nickname,
            completedImages
          );
        }
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
      const nextImage = MOCK_IMAGES.find(img => img.id === nextTrial.imageId)!;

      setSession(prev => prev ? {
        ...prev,
        currentTrialIndex: nextTrialIndex,
        trials: updatedTrials,
      } : null);

      // Показываем фиксационный крест и готовим следующее слово
      setShowFixation(true);
      setIsProcessingResponse(false);
      
      // Обновляем состояние испытания
      setTrialState(prev => ({
        ...prev!,
        currentImage: nextImage,
        currentWord: {
          word: nextTrial.word,
          type: nextTrial.wordType,
        },
      }));

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
          imageStartTime: Date.now(),
        }));
      }, FIXATION_DISPLAY_TIME);
      return () => clearTimeout(timer);
    }

    if (trialState.showImage) {
      const timer = setTimeout(() => {
        setTrialState(prev => ({
          ...prev!,
          showImage: false,
          wordStartTime: Date.now(),
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
      const firstImage = MOCK_IMAGES.find(img => img.id === firstTrial.imageId)!;
      
      console.log('First trial:', firstTrial);
      console.log('First image:', firstImage);
      
      setTrialState({
        showImage: false,
        imageStartTime: 0,
        wordStartTime: 0,
        currentImage: firstImage,
        currentWord: {
          word: firstTrial.word,
          type: firstTrial.wordType,
        },
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45 }}>
            {session.currentTrialIndex + 1}/{session.trials.length}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}
      >
        {showFixation ? (
          <Typography variant="h5" sx={{ color: 'text.primary' }}>
            +
          </Typography>
        ) : trialState.showImage ? (
          <ImageDisplay imageUrl={trialState.currentImage.url} />
        ) : (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '28px' }}>
              {trialState.currentWord.word}
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: { xs: 1, sm: 2 },
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          gap: 1
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          startIcon={<KeyboardArrowLeft />}
          onClick={() => handleResponse(true)}
        >
          Слово
        </Button>
        <Button
          variant="outlined"
          fullWidth
          endIcon={<KeyboardArrowRight />}
          onClick={() => handleResponse(false)}
        >
          Не слово
        </Button>
      </Box>
    </Box>
  );
}; 