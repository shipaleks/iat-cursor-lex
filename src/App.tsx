import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Container, CircularProgress, Typography, Button } from '@mui/material';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { NicknameForm } from './components/auth/NicknameForm';
import { Instructions } from './components/auth/Instructions';
import { ExperimentScreen } from './components/trial/ExperimentScreen';
import { CompletionScreen } from './components/trial/CompletionScreen';
import { DataExport } from './components/admin/DataExport';
import { Participant } from './types';
import { ExperimentStats } from './types';
import { signInAnonymousUser, getParticipantProgress, getParticipantProgressByNickname } from './firebase/service.tsx';
import { auth } from './firebase/config.tsx';
import { User } from 'firebase/auth';
import { IMAGES } from './utils/trialGenerator';
import { doc, setDoc, serverTimestamp, getDocs, writeBatch, collection, updateDoc } from 'firebase/firestore';
import { db } from './firebase/config.tsx';
import { ExperimentExplanation } from './components/trial/ExperimentExplanation';
import { TrialResult } from './types';
import { updateParticipantProgress, updateLeaderboard, saveSessionResults } from './firebase/service.tsx';
import { RatingCalculation } from './types';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1e1e1e',
      paper: '#262626'
    },
    primary: {
      main: '#90caf9'
    },
    secondary: {
      main: '#ce93d8'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    grey: {
      50: '#2c2c2c',
      100: '#262626',
      200: '#1e1e1e',
      300: '#161616',
      400: '#121212',
      500: '#0d0d0d',
      // Add other grey shades as needed
      800: '#000000',
      900: '#000000'
    },
    success: {
      main: '#4caf50',
      light: '#81c784'
    },
    error: {
      main: '#f44336',
      light: '#e57373'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.23)',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.5)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
});

// Определение типа устройства
const checkIsMobile = (): boolean => {
    if (typeof navigator !== 'undefined') {
        return /Mobi|Android/i.test(navigator.userAgent);
    }
    return false; // По умолчанию считаем, что не мобильное, если navigator недоступен
};

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [experimentStats, setExperimentStats] = useState<ExperimentStats | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [completedImages, setCompletedImages] = useState<string[]>([]);
  const [roundsCompleted, setRoundsCompleted] = useState(1);
  const [leaderboardRating, setLeaderboardRating] = useState<RatingCalculation | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        // Если нет пользователя, создаем нового анонимного
        try {
          const newUser = await signInAnonymousUser();
          setUser(newUser);
          setCompletedImages([]); // Сбрасываем изображения для нового пользователя
          setParticipant(null);  // Сбрасываем участника
          setExperimentStats(null); // Сбрасываем статистику
          console.log('Created new anonymous user:', newUser.uid);
        } catch (error) {
          console.error('Error during anonymous authentication:', error);
        }
      } else {
        // Если пользователь уже есть (вернулся или был создан ранее)
        setUser(currentUser);
        console.log('User already authenticated:', currentUser.uid);
        
        // Пытаемся загрузить прогресс, связанный с этим auth.currentUser.uid
        try {
          const progress = await getParticipantProgress(currentUser.uid);
          if (progress) {
            console.log('Loaded initial progress for auth user:', currentUser.uid, 'with', progress.completedImages?.length, 'images and', progress.totalSessions, 'sessions');
            setCompletedImages(progress.completedImages || []);
            // Здесь НЕ устанавливаем participant, т.к. никнейм еще не введен
          } else {
            console.log('No existing progress found for auth user:', currentUser.uid);
            setCompletedImages([]);
          }
        } catch (error) {
          console.error('Error loading initial progress:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNicknameSubmit = async (nickname: string, isTestSession: boolean) => {
    try {
      setLoading(true); 
      
      // 1. Ищем прогресс по НИКНЕЙМУ
      const existingProgress = await getParticipantProgressByNickname(nickname);
      
      if (existingProgress && existingProgress.userId) {
        // 2. Если НАШЛИ прогресс по никнейму
        console.log(`Found existing progress for nickname: ${nickname} with userId: ${existingProgress.userId}`);
        
        // Устанавливаем правильный userId для состояния participant
        const currentUserId = existingProgress.userId;
        setUser(auth.currentUser); // Обновляем auth пользователя, если нужно
        
        // Загружаем актуальные completedImages и totalSessions из найденного прогресса
        const loadedProgress = existingProgress.progress;
        setCompletedImages(loadedProgress.completedImages || []);
        const loadedSessions = loadedProgress.totalSessions || 0;
        console.log(`Loaded data for existing participant: ${loadedProgress.completedImages?.length} images, ${loadedSessions} sessions`);
        
        // Создаем объект участника с ПРАВИЛЬНЫМ userId
        const existingParticipant: Participant = {
          nickname,
          sessionId: crypto.randomUUID(),
          isTestSession,
          startTime: new Date(),
          userId: currentUserId // Используем найденный userId
        };
        setParticipant(existingParticipant);
        console.log('Restored existing participant state:', existingParticipant);

      } else {
        // 3. Если НЕ НАШЛИ прогресс по никнейму - создаем НОВОГО
        // Используем текущего АКТИВНОГО auth пользователя (auth.currentUser)
        if (!auth.currentUser) {
          throw new Error('Current user not found during new participant creation');
        }
        const currentAuthUserId = auth.currentUser.uid;
        console.log(`No existing progress for nickname ${nickname}. Creating new participant linked to auth user ${currentAuthUserId}`);
        
        // Сбрасываем completedImages, так как это новый прогресс
        setCompletedImages([]); 
        
        // Создаем связь никнейма с текущим auth userID
        await setDoc(doc(db, 'nicknames', nickname), {
          userId: currentAuthUserId,
          lastUpdated: serverTimestamp()
        });
        
        // Создаем новую запись прогресса для этого auth userID
        await setDoc(doc(db, 'progress', currentAuthUserId), {
          nickname,
          completedImages: [],
          totalSessions: 0,
          lastSessionTimestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          userId: currentAuthUserId
        });
        console.log('Created new progress entry for user:', currentAuthUserId);
        
        // Создаем объект участника с ID текущего auth пользователя
        const newParticipant: Participant = {
          nickname,
          sessionId: crypto.randomUUID(),
          isTestSession,
          startTime: new Date(),
          userId: currentAuthUserId // Связываем с текущим auth user
        };
        setParticipant(newParticipant);
        console.log('Created new participant state:', newParticipant);
      }
      
      navigate('/instructions');
    } catch (error) {
      console.error('Error handling nickname submit:', error);
    } finally {
      setLoading(false);
    }
  };

  // Хендлер завершения эксперимента
  const handleExperimentComplete = async (stats: { total: number; correct: number; totalTimeMs: number; }, trialsData: TrialResult[]) => {
    // --- Лог №1 (App): Начало обработки завершения --- 
    console.log(`[App COMPLETE START] Received stats:`, stats, `Trials data length: ${trialsData.length}`);
    setShowCompletionScreen(true);
    setExperimentStats({
      total: stats.total,
      correct: stats.correct,
      totalTimeMs: stats.totalTimeMs
    });

    const user = auth.currentUser;
    // --- Лог №2 (App): Проверка user и participant --- 
    console.log(`[App COMPLETE] User authenticated: ${!!user}, Participant exists: ${!!participant}`);

    if (user && participant) {
      const device = checkIsMobile() ? 'mobile' : 'desktop'; // Используем исправленную функцию
      // --- Лог №3 (App): Перед сохранением сессии --- 
      console.log(`[App COMPLETE] Saving session results for ${participant.nickname}`);
      try {
        await saveSessionResults(
          user.uid,
          stats.total,
          stats.correct,
          stats.totalTimeMs,
          participant.nickname,
          device
        );
        // --- Лог №4 (App): Сессия успешно сохранена --- 
        console.log(`[App COMPLETE] Session results saved successfully.`);
      } catch (error) {
        console.error("[App COMPLETE ERROR] Error saving session results:", error);
      }

      // --- Лог №5 (App): Перед обновлением прогресса --- 
      console.log(`[App COMPLETE] Updating participant progress for ${participant.nickname} with ${trialsData.length} trials.`); // Используем trialsData
      try {
        const progressBeforeUpdate = await getParticipantProgress(user.uid);
        const sessionsBeforeUpdate = progressBeforeUpdate?.totalSessions || 0;
        console.log(`[App COMPLETE] Total sessions BEFORE progress update: ${sessionsBeforeUpdate}`);

        // Передаем trialsData в updateParticipantProgress
        await updateParticipantProgress(user.uid, participant.nickname, trialsData);
        
        // --- Лог №6 (App): Прогресс успешно обновлен, проверка сессий --- 
        console.log(`[App COMPLETE] Participant progress updated. Verifying session count...`);
        const progressAfterUpdate = await getParticipantProgress(user.uid);
        const sessionsAfterUpdate = progressAfterUpdate?.totalSessions || 0;
        console.log(`[App COMPLETE] Total sessions AFTER progress update: ${sessionsAfterUpdate}`);
        
        if (sessionsAfterUpdate <= sessionsBeforeUpdate) {
          console.warn(`[App COMPLETE WARN] totalSessions did not increase, forcing update (${sessionsBeforeUpdate} -> ${sessionsBeforeUpdate + 1})`);
          const progressRef = doc(db, 'progress', user.uid);
          await updateDoc(progressRef, {
            totalSessions: sessionsBeforeUpdate + 1,
            lastSessionTimestamp: serverTimestamp()
          });
        }

        // --- Лог №7 (App): Перед вызовом updateLeaderboard --- 
        const normalizedNickname = participant.nickname.toLowerCase();
        console.log(`[App COMPLETE] === Calling updateLeaderboard with Nick: ${normalizedNickname}, UID: ${user.uid}, Correct: ${stats.correct}, Total: ${stats.total}, Time: ${stats.totalTimeMs}, Device: ${device} ===`);
        
        const ratingData = await updateLeaderboard(
          normalizedNickname,
          user.uid,
          stats.correct, // Берем из stats
          stats.total,   // Берем из stats
          stats.totalTimeMs, // Берем из stats
          device
        );
        setLeaderboardRating(ratingData);
        // --- Лог №8 (App): После вызова updateLeaderboard --- 
        console.log("[App COMPLETE] Leaderboard update call finished. Returned rating data:", ratingData);
        
      } catch (error) {
        // --- Лог №9 (App): Ошибка при обновлении прогресса или лидерборда --- 
        console.error("[App COMPLETE ERROR] Error during progress or leaderboard update:", error);
      }
    } else {
      // --- Лог №10 (App): Пользователь или участник недоступен --- 
      console.warn("[App COMPLETE WARN] User or participant not available on experiment complete.")
    }
    // --- Лог №11 (App): Конец обработки завершения --- 
    console.log(`[App COMPLETE END] Finished handling experiment completion.`);
  };

  const handleStartNewSession = () => {
    // Используем ID ТЕКУЩЕГО УЧАСТНИКА
    if (participant && participant.userId) {
      console.log(`Starting new session for participant ${participant.nickname} (userId: ${participant.userId})`);
      setShowCompletionScreen(false);
      
      // Обновляем participant state для новой сессии
      setParticipant({
        ...participant,
        sessionId: crypto.randomUUID(),
        isTestSession: false
      });
      
      setExperimentStats(null);
      
      // Загружаем АКТУАЛЬНЫЙ прогресс перед началом нового раунда
      // Гарантируем, что completedImages корректны для createSession
      getParticipantProgress(participant.userId)
        .then(progress => {
          if (progress) {
            setCompletedImages(progress.completedImages || []);
            console.log(`Loaded progress before new round: ${progress.completedImages?.length} images, ${progress.totalSessions} sessions`);
            navigate('/experiment');
          } else {
            console.warn(`Could not load progress before new round for user ${participant.userId}`);
            setCompletedImages([]);
            navigate('/experiment');
          }
        })
        .catch(error => {
          console.error('Error loading progress before new round:', error);
          setCompletedImages([]);
          navigate('/experiment');
        });

    } else {
      console.warn('Cannot start new session: participant or userId is missing.');
      // Возможно, перенаправить на главную или показать ошибку
      navigate('/');
    }
  };

  // Загрузка прогресса участника
  const loadParticipantProgress = async (userId: string) => {
    setLoading(true);
    try {
      const progress = await getParticipantProgress(userId);
      if (progress) {
        setCompletedImages(progress.completedImages || []);
        // === ДОБАВЛЯЕМ РАСЧЕТ И ОБНОВЛЕНИЕ roundsCompleted ===
        const calculatedRounds = Math.max(1, progress.totalSessions || 0);
        setRoundsCompleted(calculatedRounds);
        console.log(`[App] Progress loaded for ${userId}, calculated rounds: ${calculatedRounds} (based on ${progress.totalSessions} totalSessions)`);
        // === КОНЕЦ ДОБАВЛЕНИЯ ===
      } else {
        setCompletedImages([]);
        setRoundsCompleted(1); // Если прогресса нет, начинаем с 1 раунда
        console.log(`[App] No progress found for ${userId}, setting rounds to 1`);
      }
    } catch (error) {
      console.error("Error loading participant progress:", error);
      setCompletedImages([]);
      setRoundsCompleted(1); // В случае ошибки тоже ставим 1 раунд
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.default'
          }}
        >
          <CircularProgress size={48} thickness={4} />
          <Typography
            variant="h6"
            color="text.secondary"
            align="center"
            sx={{
              animation: 'fadeIn 1.5s infinite alternate',
              '@keyframes fadeIn': {
                '0%': { opacity: 0.5 },
                '100%': { opacity: 1 }
              }
            }}
          >
            Подготовка к игре...
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '200px', // Фиксированная ширина для контейнера кнопок
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Логика для отображения рейтинга
                console.log('Leaderboard button clicked');
              }}
              sx={{ 
                width: '100%',
                boxShadow: 0
              }}
            >
              Рейтинг игроков
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/instructions')}
              sx={{ 
                width: '100%',
                boxShadow: 0
              }}
            >
              Продолжить
            </Button>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        bgcolor="background.default"
        display="flex"
        alignItems="stretch"
        sx={{
          py: { xs: 0, sm: 2 }
        }}
      >
        {(!participant || showCompletionScreen) && (
          <DataExport />
        )}
        <Container
          disableGutters
          sx={{
            height: '100%',
            maxWidth: { xs: '100%', sm: 900 },
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
            borderRadius: { xs: 0, sm: 2 },
            boxShadow: { xs: 0, sm: 3 },
            overflow: 'auto'
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                user && !participant ? (
                  <NicknameForm onSubmit={handleNicknameSubmit} />
                ) : (
                  <Navigate to={user && participant ? "/instructions" : "/"} replace />
                )
              }
            />
            <Route
              path="/start"
              element={
                user ? (
                  participant ? (
                    <Navigate to="/instructions" replace />
                  ) : (
                    <NicknameForm onSubmit={handleNicknameSubmit} />
                  )
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/instructions"
              element={
                participant ? (
                  <Instructions onStart={() => {
                    console.log('Starting experiment for participant:', participant.nickname);
                    setShowCompletionScreen(false);
                    navigate('/experiment');
                  }} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/experiment"
              element={
                participant ? (
                  <ExperimentScreen
                    participant={participant}
                    onComplete={handleExperimentComplete}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route
              path="/completion"
              element={
                participant && experimentStats ? (
                  <CompletionScreen 
                    participant={participant}
                    sessionStats={{
                      totalTrials: experimentStats.total,
                      correctTrials: experimentStats.correct,
                      totalTimeMs: experimentStats.totalTimeMs
                    }}
                    onNextRound={handleStartNewSession}
                  />
                ) : (
                  <Navigate to="/start" />
                )
              }
            />
            <Route path="/explanation" element={<ExperimentExplanation />} />
          </Routes>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
