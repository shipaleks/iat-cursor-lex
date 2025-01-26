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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase/config.tsx';

const theme = createTheme({
  palette: {
    background: {
      default: '#e0e0e0',
      paper: '#f5f5f5'
    },
    primary: {
      main: '#000000'
    }
  }
});

const App = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [experimentStats, setExperimentStats] = useState<ExperimentStats | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [completedImages, setCompletedImages] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        try {
          const newUser = await signInAnonymousUser();
          setUser(newUser);
        } catch (error) {
          console.error('Error during anonymous authentication:', error);
        }
      } else {
        setUser(user);
        // Загружаем прогресс при авторизации
        try {
          const progress = await getParticipantProgress(user.uid);
          if (progress) {
            setCompletedImages(progress.completedImages || []);
          }
        } catch (error) {
          console.error('Error loading progress:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNicknameSubmit = async (nickname: string, isTestSession: boolean) => {
    try {
      // Проверяем, существует ли уже такой никнейм
      const existingProgress = await getParticipantProgressByNickname(nickname);
      
      // Создаем новую анонимную сессию
      const newUser = await signInAnonymousUser();
      if (!newUser) {
        throw new Error('Failed to create anonymous user');
      }

      if (existingProgress) {
        console.log('Found existing progress:', existingProgress);
        // Обновляем запись в nicknames с новым userId
        await setDoc(doc(db, 'nicknames', nickname), {
          userId: newUser.uid,
          lastUpdated: serverTimestamp()
        });

        // Копируем существующий прогресс для нового userId
        await setDoc(doc(db, 'progress', newUser.uid), {
          nickname,
          completedImages: existingProgress.progress.completedImages || [],
          totalSessions: existingProgress.progress.totalSessions || 0,
          lastSessionTimestamp: serverTimestamp()
        });

        // Устанавливаем completedImages из существующего прогресса
        setCompletedImages(existingProgress.progress.completedImages || []);
        console.log('Restored progress:', {
          completedImages: existingProgress.progress.completedImages?.length || 0,
          rounds: Math.floor((existingProgress.progress.completedImages?.length || 0) / 4)
        });
      } else {
        // Для нового пользователя начинаем с пустого прогресса
        setCompletedImages([]);
        
        // Создаем запись в nicknames
        await setDoc(doc(db, 'nicknames', nickname), {
          userId: newUser.uid,
          lastUpdated: serverTimestamp()
        });

        // Создаем новый прогресс
        await setDoc(doc(db, 'progress', newUser.uid), {
          nickname,
          completedImages: [],
          totalSessions: 0,
          lastSessionTimestamp: serverTimestamp()
        });
      }
      
      // Создаем нового участника
      setParticipant({
        nickname,
        sessionId: crypto.randomUUID(),
        isTestSession,
        startTime: new Date()
      } as Participant);

      navigate('/instructions');
    } catch (error) {
      console.error('Error in handleNicknameSubmit:', error);
    }
  };

  const handleExperimentComplete = async (stats: ExperimentStats) => {
    setExperimentStats(stats);
    setShowCompletionScreen(true);
    
    // Проверяем, может ли участник продолжить
    if (user && !participant?.isTestSession) {
      try {
        const progress = await getParticipantProgress(user.uid);
        if (progress) {
          // Обновляем состояние completedImages
          setCompletedImages(progress.completedImages || []);
          const canStartNewSession = (progress.completedImages || []).length < IMAGES.length;
          console.log('Progress check:', { 
            completedImages: progress.completedImages, 
            totalImages: IMAGES.length, 
            canStartNewSession 
          });
          setCanContinue(canStartNewSession);
        } else {
          // Если прогресса нет, значит это первый раунд
          setCompletedImages([]);
          setCanContinue(true);
        }
      } catch (error) {
        console.error('Error checking progress:', error);
        // В случае ошибки позволяем продолжить
        setCanContinue(true);
      }
    } else {
      setCanContinue(false);
    }
  };

  const handleStartNewSession = () => {
    if (participant) {
      setShowCompletionScreen(false);
      // Создаем новую сессию с новым ID, сохраняя остальные параметры
      setParticipant({
        ...participant,
        sessionId: crypto.randomUUID()
      });
      setExperimentStats(null);
      navigate('/experiment');
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
            maxWidth: { xs: '100%', sm: 600 },
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
                  <Navigate to="/instructions" replace />
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
                showCompletionScreen && participant && experimentStats ? (
                  <CompletionScreen
                    participant={participant}
                    sessionStats={{
                      totalTrials: experimentStats.total,
                      correctTrials: experimentStats.correct,
                      totalTimeMs: experimentStats.totalTimeMs
                    }}
                    canContinue={canContinue}
                    onStartNewSession={handleStartNewSession}
                    completedImages={completedImages}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
