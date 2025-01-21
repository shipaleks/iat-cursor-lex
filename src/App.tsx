import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Container, CircularProgress } from '@mui/material';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { NicknameForm } from './components/auth/NicknameForm';
import { Instructions } from './components/auth/Instructions';
import { ExperimentScreen } from './components/trial/ExperimentScreen';
import { CompletionScreen } from './components/CompletionScreen';
import { DataExport } from './components/admin/DataExport';
import { Participant, ExperimentStats } from './types';
import { signInAnonymousUser, getParticipantProgress } from './firebase/service';
import { auth } from './firebase/config';
import { User } from 'firebase/auth';
import { MOCK_IMAGES } from './components/trial/ExperimentScreen';

const theme = createTheme({
  palette: {
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNicknameSubmit = (nickname: string, isTestSession: boolean, existingUserId?: string) => {
    if (user) {
      // Если передан existingUserId, используем его вместо текущего ID
      const participantId = existingUserId || user.uid;
      
      setParticipant({
        nickname,
        sessionId: crypto.randomUUID(),
        startTime: new Date(),
        isTestSession
      });

      // Если это существующий пользователь, обновляем текущего пользователя
      if (existingUserId) {
        setUser(prev => prev ? { ...prev, uid: existingUserId } : null);
      }
    }
  };

  const handleExperimentComplete = async (stats: ExperimentStats) => {
    setExperimentStats(stats);
    setShowCompletionScreen(true);
    
    // Проверяем, может ли участник продолжить
    if (user && !participant?.isTestSession) {
      const progress = await getParticipantProgress(user.uid);
      if (progress) {
        const canStartNewSession = progress.completedImages.length < MOCK_IMAGES.length;
        setCanContinue(canStartNewSession);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
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
        {(!participant || showCompletionScreen) && <DataExport />}
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
                showCompletionScreen && experimentStats ? (
                  <CompletionScreen
                    participant={participant!}
                    sessionStats={{
                      totalTrials: experimentStats.total,
                      correctTrials: experimentStats.correct
                    }}
                    canContinue={canContinue}
                    onStartNewSession={handleStartNewSession}
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
