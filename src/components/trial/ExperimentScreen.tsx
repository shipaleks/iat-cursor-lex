import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, LinearProgress, useTheme, useMediaQuery, Button, CircularProgress } from '@mui/material';
import { ImageDisplay } from './ImageDisplay';
import { WordDisplay } from './WordDisplay';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Session, TrialState, ImageData, TrialResult } from '../../types';
import { createSession, IMAGES } from '../../utils/trialGenerator';
import { saveTrialResult, saveSessionResults, updateLeaderboard, updateParticipantProgress, getPreviousTrials } from '../../firebase/service.tsx';
import { auth } from '../../firebase/config.tsx';
import { getParticipantProgress, getParticipantProgressByNickname } from '../../firebase/service.tsx';
import { getDeviceType } from '../../utils/deviceUtils';

const IMAGE_DISPLAY_TIME = 1500; // ms

// Глобальная переменная для хранения временной метки начала измерения с максимальной точностью
// Избегаем использования React state для минимизации задержек
let precisionStartTimeRef: number | null = null;

interface ExperimentScreenProps {
  participant: {
    sessionId: string;
    nickname: string;
    isTestSession: boolean;
    userId: string;
  };
  onComplete: (stats: { correct: number; total: number; totalTimeMs: number }, trialsData: TrialResult[]) => void;
}

export const ExperimentScreen: React.FC<ExperimentScreenProps> = ({ participant, onComplete }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [trialState, setTrialState] = useState<TrialState | null>(null);
  const [lastResponse, setLastResponse] = useState<{ isCorrect: boolean; button: 'left' | 'right' } | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [sessionStartTime] = useState(performance.now());
  const [isProcessingResponse, setIsProcessingResponse] = useState(false);
  const [wordColor, setWordColor] = useState<'default' | 'success.main' | 'error.main'>('default');
  const [completedTrialsData, setCompletedTrialsData] = useState<TrialResult[]>([]);

  // Используем useRef для прямого доступа к временной метке без перерендеринга
  const startTimeRef = useRef<number | null>(null);

  // Инициализация сессии
  useEffect(() => {
    const initSession = async () => {
      if (!participant || !participant.userId) return;

      try {
        const progress = await getParticipantProgress(participant.userId);
        const completedImages = progress?.completedImages || [];
        const imagesSeenWithRealWord = progress?.imagesSeenWithRealWord || [];
        const v8SeenCount = progress?.v8ImagesSeenCount || 0;
        const v10SeenCount = progress?.v10ImagesSeenCount || 0;
        
        const previousTrials = await getPreviousTrials(participant.userId);
        
        console.log(`Initializing session for user ${participant.userId} with ${completedImages.length} completed images, ${imagesSeenWithRealWord.length} seen with real word, v8/v10 counts: ${v8SeenCount}/${v10SeenCount}, and ${previousTrials.length} previous trials`);
        
        const session = await createSession(
          participant.sessionId,
          completedImages,
          imagesSeenWithRealWord,
          previousTrials,
          participant.isTestSession,
          v8SeenCount,
          v10SeenCount
        );
        
        if (!session) {
          throw new Error('Failed to create session');
        }

        setSession(session);
        
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initSession();
  }, [participant]);

  const handleResponse = async (isWord: boolean) => {
    if (!session || !trialState || trialState.showImage || isProcessingResponse || !participant.userId) return;

    // Мгновенно получаем текущее время с максимальной точностью
    const preciseEndTime = performance.now();
    
    // Рассчитываем реакцию на основе прямых временных меток, минуя React state
    const actualStartTime = startTimeRef.current || precisionStartTimeRef || 0;
    const reactionTime = Math.round(preciseEndTime - actualStartTime);
    
    // Добавляем отладочный вывод
    console.log('[TIME] Response received:', { 
      start: actualStartTime, 
      end: preciseEndTime, 
      reaction: reactionTime,
      stateStartTime: trialState.startTime
    });

    setIsProcessingResponse(true);
    
    const currentTrial = session.trials[session.currentTrialIndex];
    const isCorrect = (isWord && currentTrial.wordType !== 'non-word') || 
                     (!isWord && currentTrial.wordType === 'non-word');

    // Set button response immediately
    setLastResponse({
      isCorrect: isCorrect,
      button: isWord ? 'right' : 'left'
    });
    
    // Устанавливаем цвет в зависимости от правильности ответа
    setWordColor(isCorrect ? 'success.main' : 'error.main');
    
    // Increment correct answers counter if needed
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
    
    // Ждем 300мс для отображения цвета
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Сбрасываем цвет и скрываем слово
    setWordColor('default');

    // Save trial result to Firebase only for non-test sessions
    if (!participant.isTestSession) {
      const trialResultData: TrialResult = {
        participantNickname: participant.nickname,
        imageFileName: currentTrial.imageFileName,
        word: currentTrial.word,
        wordType: currentTrial.wordType,
        isCorrect: isCorrect,
        reactionTimeMs: reactionTime
      };
      setCompletedTrialsData(prev => [...prev, trialResultData]);
      await saveTrialResult(trialResultData, participant.userId);
    }

    // Переходим к следующему испытанию
    const nextTrialIndex = session.currentTrialIndex + 1;
    
    if (nextTrialIndex >= session.trials.length) {
      // Используем Performance API для более точного измерения общего времени
      const totalTime = Math.round(performance.now() - sessionStartTime);
      const finalCorrectAnswers = correctAnswers + (isCorrect ? 1 : 0);
      
      if (!participant.isTestSession && participant.userId) {
        const uniqueCompletedImagesInSession = [...new Set(session.trials
          .map(t => t.imageFileName)
          .filter((fileName): fileName is string => !!fileName)
        )];
        console.log('Unique images completed in this session:', uniqueCompletedImagesInSession);
        console.log('Image filenames:', uniqueCompletedImagesInSession.join(', '));

        // await saveSessionResults(
        //   participant.userId,
        //   session.trials.length,
        //   finalCorrectAnswers,
        //   totalTime,
        //   participant.nickname,
        //   getDeviceType()
        // );

        // --- УДАЛЯЕМ ЭТОТ ВЫЗОВ --- 
        // await updateParticipantProgress(
        //   participant.userId,
        //   participant.nickname,
        //   session.trials 
        // );
        // --- КОНЕЦ УДАЛЕНИЯ ---

        // Вызов обновления лидерборда отсюда тоже можно убрать, 
        // т.к. он теперь делается в App.tsx после updateParticipantProgress
        // try {
        //   await updateLeaderboard(...);
        // } catch (error) { ... }
      }
      
      onComplete({
        correct: finalCorrectAnswers,
        total: session.trials.length,
        totalTimeMs: totalTime
      }, completedTrialsData);
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

      // Предзагружаем изображение перед показом
      const preloadImage = new Image();
      let loadStarted = false;

      preloadImage.onload = () => {
        console.log(`Next image (${nextImage.fileName}) preloaded successfully`);
        
        // Устанавливаем состояние только если загрузка не началась ранее
        if (!loadStarted) {
          loadStarted = true;
          
          // Обновляем состояние испытания с предзагруженным изображением
          setTrialState({
            trial: nextTrial,
            image: nextImage,
            showImage: true,
            showWord: false,
            lastResponse: null,
            startTime: null,
            preloadedImage: preloadImage
          });
          
          // Сбрасываем подсветку кнопок при показе новой картинки
          setLastResponse(null);
          
          // Разрешаем новые ответы
          setIsProcessingResponse(false);
        }
      };

      preloadImage.onerror = () => {
        console.error(`Failed to preload next image: ${nextImage.url}`);
        // В случае ошибки все равно показываем, но без предзагрузки
        if (!loadStarted) {
          loadStarted = true;
          
          setTrialState({
            trial: nextTrial,
            image: nextImage,
            showImage: true,
            showWord: false,
            lastResponse: null,
            startTime: null,
            preloadedImage: null
          });
          
          setLastResponse(null);
          setIsProcessingResponse(false);
        }
      };

      // Добавляем временную метку для предотвращения кеширования
      const timestamp = new Date().getTime();
      preloadImage.src = `${nextImage.url}?t=${timestamp}`;
    }
  };

  // Инициализация первого испытания
  useEffect(() => {
    if (session && !trialState) {
      console.log('Initializing first trial');
      const firstTrial = session.trials[0];
      const firstImage = IMAGES.find(img => img.id === firstTrial.imageId)!;
      
      console.log('First trial:', firstTrial);
      console.log('First image:', firstImage);
      
      // Предзагружаем изображение перед показом
      const preloadImage = new Image();
      preloadImage.onload = () => {
        console.log('First image preloaded successfully');
        // Устанавливаем состояние только когда изображение загружено
        setTrialState({
          trial: firstTrial,
          image: firstImage,
          showImage: true,
          showWord: false,
          lastResponse: null,
          startTime: null,
          preloadedImage: preloadImage // Сохраняем предзагруженное изображение
        });
      };
      preloadImage.onerror = () => {
        console.error('Failed to preload first image:', firstImage.url);
        // В случае ошибки все равно показываем, но без предзагрузки
        setTrialState({
          trial: firstTrial,
          image: firstImage,
          showImage: true,
          showWord: false,
          lastResponse: null,
          startTime: null
        });
      };
      
      // Добавляем временную метку для предотвращения кеширования
      const timestamp = new Date().getTime();
      preloadImage.src = `${firstImage.url}?t=${timestamp}`;
    }
  }, [session, trialState]);

  // Обновляем обработчик нажатий клавиш для использования специального захвата событий
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Удаляем проверку event.repeat, чтобы разрешить автоповтор при зажатии клавиши
    // if (event.repeat) return;

    // Получаем время события непосредственно из события DOM
    const eventTime = performance.now();
    console.log('[TIME] Key press detected:', event.key, 'at time:', eventTime, 
      'delta:', precisionStartTimeRef ? (eventTime - precisionStartTimeRef) : 'N/A');
    
    if (event.key === 'ArrowLeft') {
      handleResponse(false); // НЕ СЛОВО
    } else if (event.key === 'ArrowRight') {
      handleResponse(true); // СЛОВО
    }
  }, [handleResponse]);

  // Регистрируем обработчик нажатий клавиш с флагом захвата (capture)
  useEffect(() => {
    // Используем фазу захвата для максимально раннего получения события
    window.addEventListener('keydown', handleKeyPress, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyPress, { capture: true });
  }, [handleKeyPress]);

  // Управление показом изображения и слова - модифицируем для использования requestAnimationFrame
  useEffect(() => {
    if (!session || !trialState) return;

    if (trialState.showImage) {
      const timer = setTimeout(() => {
        // Используем requestAnimationFrame для синхронизации с циклом отрисовки
        requestAnimationFrame(() => {
          setTrialState(prev => ({
            ...prev!,
            showImage: false,
            // Больше не устанавливаем startTime здесь - это будет делать DOM-обработчик напрямую
            startTime: null, // Установим временную метку через DOM напрямую
          }));
          
          // Сразу устанавливаем высокоточную метку времени начала
          precisionStartTimeRef = performance.now();
          startTimeRef.current = precisionStartTimeRef;
          
          // Добавляем отладочный вывод
          console.log('[TIME] Precision timer started at:', precisionStartTimeRef);
        });
      }, IMAGE_DISPLAY_TIME);
      
      return () => clearTimeout(timer);
    }
  }, [trialState?.showImage, session]);

  // Сбрасываем подсветку кнопок при показе изображения
  useEffect(() => {
    if (trialState?.showImage) {
      setLastResponse(null);
    }
  }, [trialState?.showImage]);

  // Предзагрузка следующего изображения после показа текущего
  useEffect(() => {
    if (!session || !trialState || trialState.showImage) return;
    
    // Если есть следующее испытание, предзагружаем его изображение
    const nextTrialIndex = session.currentTrialIndex + 1;
    if (nextTrialIndex < session.trials.length) {
      const nextTrial = session.trials[nextTrialIndex];
      const nextImage = IMAGES.find(img => img.id === nextTrial.imageId);
      
      if (nextImage) {
        // Создаем новый элемент изображения для предзагрузки
        const preloadNextImage = new Image();
        preloadNextImage.onload = () => {
          console.log(`Next image (${nextImage.fileName}) preloaded successfully`);
        };
        preloadNextImage.onerror = () => {
          console.warn(`Failed to preload next image: ${nextImage.url}`);
        };
        
        // Добавляем временную метку для предотвращения кеширования
        const timestamp = new Date().getTime();
        preloadNextImage.src = `${nextImage.url}?t=${timestamp}`;
      }
    }
  }, [session, trialState?.showImage]);

  // Также модифицируем обработчики кнопок для использования прямых временных меток
  const handleButtonClick = (isWord: boolean) => {
    // Мгновенно получаем время клика напрямую, минуя React state
    const clickTime = performance.now();
    console.log('[TIME] Button click detected at:', clickTime, 
      'delta:', precisionStartTimeRef ? (clickTime - precisionStartTimeRef) : 'N/A');
    
    handleResponse(isWord);
  };

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
        bgcolor: 'background.default'
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
              sx={{ 
                height: 4, 
                borderRadius: 1,
                bgcolor: 'grey.800',
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
          bgcolor: 'background.paper',
          p: 2
        }}
      >
        {trialState.showImage ? (
          <ImageDisplay 
            imageUrl={trialState.image.url} 
            preloadedImage={trialState.preloadedImage} 
          />
        ) : (
          <WordDisplay 
            word={trialState.trial.word} 
            color={wordColor}
          />
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
          onClick={() => handleButtonClick(false)}
          sx={{
            height: { xs: 56, sm: 'auto' },
            color: lastResponse?.button === 'left' 
              ? (lastResponse.isCorrect ? 'success.light' : 'error.light')
              : 'inherit',
            borderColor: lastResponse?.button === 'left'
              ? (lastResponse.isCorrect ? 'success.light' : 'error.light')
              : 'rgba(255, 255, 255, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: lastResponse?.button === 'left'
                ? (lastResponse.isCorrect ? 'success.light' : 'error.light')
                : 'rgba(255, 255, 255, 0.5)',
              bgcolor: 'rgba(30, 30, 30, 0.4)'
            },
            '& .MuiTouchRipple-root': {
              display: 'none'
            }
          }}
        >
          Не слово
        </Button>
        <Button
          variant="outlined"
          fullWidth
          endIcon={<KeyboardArrowRight />}
          onClick={() => handleButtonClick(true)}
          sx={{
            height: { xs: 56, sm: 'auto' },
            color: lastResponse?.button === 'right'
              ? (lastResponse.isCorrect ? 'success.light' : 'error.light')
              : 'inherit',
            borderColor: lastResponse?.button === 'right'
              ? (lastResponse.isCorrect ? 'success.light' : 'error.light')
              : 'rgba(255, 255, 255, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: lastResponse?.button === 'right'
                ? (lastResponse.isCorrect ? 'success.light' : 'error.light')
                : 'rgba(255, 255, 255, 0.5)',
              bgcolor: 'rgba(30, 30, 30, 0.4)'
            },
            '& .MuiTouchRipple-root': {
              display: 'none'
            }
          }}
        >
          Слово
        </Button>
      </Box>
    </Box>
  );
}; 