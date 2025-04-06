import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { getParticipantProgressByNickname, getLeaderboard } from '../../firebase/service.tsx';
import { useNavigate } from 'react-router-dom';
import { LeaderboardEntry } from '../../types';

// Функция маскировки никнейма
const maskNickname = (nickname: string): string => {
  if (!nickname || nickname.length <= 3) return nickname;
  
  return `${nickname.slice(0, 2)}${'*'.repeat(nickname.length - 3)}${nickname.slice(-1)}`;
};

interface NicknameFormProps {
  onSubmit: (nickname: string, isTestSession: boolean) => void;
}

export const NicknameForm: React.FC<NicknameFormProps> = ({ onSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Всегда создаем нового пользователя, независимо от того, 
      // существует никнейм или нет
      console.log('Создание новой игровой сессии для никнейма:', nickname);
      onSubmit(nickname, false);
    } catch (error) {
      console.error('Ошибка при обработке никнейма:', error);
      setErrorMessage('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTestModeClick = () => {
    if (!nickname.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя для тренировки');
      return;
    }
    
    onSubmit(nickname, true);
    navigate('/experiment');
  };
  
  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboardData(data.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };
  
  // Форматирование времени для отображения
  const formatTime = (ms: number | undefined): string => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        p: 3
      }}
    >
      <Typography variant="h5" align="center" gutterBottom>
        Введите ваше имя
      </Typography>
      
      <TextField
        fullWidth
        label="Имя"
        variant="outlined"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        error={!!errorMessage}
        helperText={errorMessage}
        disabled={isLoading}
        autoFocus
      />
      
      <Button 
        type="submit" 
        variant="contained" 
        color="primary"
        disabled={isLoading}
        sx={{ py: 1.5 }}
      >
        Начать
      </Button>
      
      <Button 
        variant="outlined"
        disabled={isLoading}
        onClick={handleTestModeClick}
      >
        Тренировка
      </Button>
      
      <Button 
        variant="text"
        onClick={() => {
          loadLeaderboard();
          setShowLeaderboard(true);
        }}
      >
        Рейтинг игроков
      </Button>
      
      <Dialog 
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        maxWidth="md"
      >
        <DialogTitle align="center">Рейтинг игроков</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Место</TableCell>
                <TableCell>Имя</TableCell>
                <TableCell align="right">Точность</TableCell>
                <TableCell align="right">Время</TableCell>
                <TableCell align="right">Баллы</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaderboardData.map((entry, index) => (
                <TableRow key={entry.nickname}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{maskNickname(entry.nickname)}</TableCell>
                  <TableCell align="right">
                    {entry.ratingDetails?.accuracy !== undefined ? entry.ratingDetails.accuracy.toFixed(1) : '0.0'}%
                  </TableCell>
                  <TableCell align="right">
                    {formatTime(entry.totalTimeMs)}
                  </TableCell>
                  <TableCell align="right">{Math.round(entry.score || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Box>
  );
}; 