import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, FormControlLabel, Checkbox, CircularProgress, Dialog, DialogTitle, DialogContent, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getParticipantProgressByNickname, getLeaderboard } from '../../firebase/service.tsx';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface NicknameFormProps {
  onSubmit: (nickname: string, isTestSession: boolean, existingUserId?: string) => void;
}

export const NicknameForm: React.FC<NicknameFormProps> = ({ onSubmit }) => {
  const [nickname, setNickname] = useState('');
  const [isTestSession, setIsTestSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Введите никнейм');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Проверяем, существует ли участник с таким никнеймом
      const existingParticipant = await getParticipantProgressByNickname(nickname.trim());
      
      if (existingParticipant && !isTestSession) {
        // Если это не тестовая сессия и участник существует,
        // используем его существующий ID
        await onSubmit(nickname.trim(), isTestSession, existingParticipant.userId);
      } else {
        // Если это тестовая сессия или новый участник,
        // создаем новую запись
        await onSubmit(nickname.trim(), isTestSession);
      }
      
      navigate('/instructions');
    } catch (error) {
      console.error('Error checking nickname:', error);
      setError('Произошла ошибка при проверке никнейма. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      setLeaderboardData(data.sort((a, b) => b.score - a.score));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
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
          setError(null);
        }}
        error={error !== null}
        helperText={error}
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
        label="Тестовый раунд (результаты не сохранятся, перезагрузите страницу для полной игры)"
      />

      <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={!nickname.trim()}
        >
          Продолжить
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            loadLeaderboard();
            setShowLeaderboard(true);
          }}
        >
          Рейтинг игроков
        </Button>
      </Box>

      <Dialog
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Рейтинг игроков</DialogTitle>
        <DialogContent>
          <Table>
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
                  <TableCell>{entry.nickname}</TableCell>
                  <TableCell align="right">{entry.accuracy.toFixed(1)}%</TableCell>
                  <TableCell align="right">
                    {Math.floor(entry.totalTime / (1000 * 60))}:
                    {String(Math.floor((entry.totalTime % (1000 * 60)) / 1000)).padStart(2, '0')}
                  </TableCell>
                  <TableCell align="right">{Math.round(entry.score)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Box>
  );
}; 