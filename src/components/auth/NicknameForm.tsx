import React, { useState } from 'react';
import { Box, TextField, Button, Typography, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getParticipantProgressByNickname } from '../../firebase/service';

interface NicknameFormProps {
  onSubmit: (nickname: string, isTestSession: boolean, existingUserId?: string) => void;
}

export const NicknameForm: React.FC<NicknameFormProps> = ({ onSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [isTestSession, setIsTestSession] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError(true);
      return;
    }

    setLoading(true);
    try {
      // Проверяем, существует ли участник с таким никнеймом
      const existingParticipant = await getParticipantProgressByNickname(nickname.trim());
      
      if (existingParticipant && !isTestSession) {
        // Если это не тестовая сессия и участник существует,
        // используем его существующий ID
        onSubmit(nickname.trim(), isTestSession, existingParticipant.userId);
      } else {
        // Если это тестовая сессия или новый участник,
        // создаем новую запись
        onSubmit(nickname.trim(), isTestSession);
      }
      
      navigate('/instructions');
    } catch (error) {
      console.error('Error checking nickname:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 4,
        width: '100%',
        maxWidth: 400,
        mx: 'auto'
      }}
    >
      <Typography variant="h4" align="center" gutterBottom>
        Добро пожаловать
      </Typography>

      <TextField
        label="Ваше имя или никнейм"
        value={nickname}
        onChange={(e) => {
          setNickname(e.target.value);
          setError(false);
        }}
        error={error}
        helperText={error ? 'Пожалуйста, введите имя' : ''}
        fullWidth
        autoFocus
        disabled={loading}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={isTestSession}
            onChange={(e) => setIsTestSession(e.target.checked)}
            disabled={loading}
          />
        }
        label="Тестовая сессия (результаты не будут сохранены)"
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Начать'}
      </Button>
    </Box>
  );
}; 