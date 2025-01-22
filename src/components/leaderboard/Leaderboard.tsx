import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getLeaderboard } from '../../firebase/service.tsx';

export interface LeaderboardEntry {
  nickname: string;
  accuracy: number;
  totalTime: number;
  score: number;
  rank?: number;
}

interface LeaderboardProps {
  currentUserNickname?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserNickname }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        // Сортируем по убыванию рейтинга и добавляем ранг
        const sortedData = data
          .sort((a, b) => b.score - a.score)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1
          }));
        setLeaderboard(sortedData);
      } catch (err) {
        setError('Не удалось загрузить таблицу лидеров');
        console.error('Error loading leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography>Загрузка результатов...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const top5 = leaderboard.slice(0, 5);
  const currentUser = currentUserNickname 
    ? leaderboard.find(entry => entry.nickname === currentUserNickname)
    : null;
  const isCurrentUserInTop5 = currentUser ? currentUser.rank! <= 5 : false;
  const showExpandButton = leaderboard.length > 5;

  const displayedEntries = showAll 
    ? leaderboard 
    : isCurrentUserInTop5 
      ? top5 
      : [...top5, ...(currentUser ? [currentUser] : [])];

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Typography variant="h5" gutterBottom align="center">
        Таблица лидеров
      </Typography>

      {currentUser && !isCurrentUserInTop5 && !showAll && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
          <Typography variant="body2" align="center">
            Ваша позиция: {currentUser.rank} место
          </Typography>
        </Box>
      )}

      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: showAll ? '50vh' : 'auto',
          overflowY: showAll ? 'auto' : 'hidden'
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Место</TableCell>
              <TableCell>Имя</TableCell>
              <TableCell align="right">Точность</TableCell>
              <TableCell align="right">Общее время</TableCell>
              <TableCell align="right">Баллы</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedEntries.map((entry) => (
              <TableRow 
                key={entry.nickname}
                sx={{
                  bgcolor: entry.nickname === currentUserNickname 
                    ? 'primary.light' 
                    : 'inherit'
                }}
              >
                <TableCell>{entry.rank}</TableCell>
                <TableCell>{entry.nickname}</TableCell>
                <TableCell align="right">
                  {entry.accuracy.toFixed(1)}%
                </TableCell>
                <TableCell align="right">
                  {formatTime(entry.totalTime)}
                </TableCell>
                <TableCell align="right">
                  {entry.score.toFixed(0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showExpandButton && (
        <Box display="flex" justifyContent="center" mt={2}>
          <IconButton 
            onClick={() => setShowAll(!showAll)}
            aria-label={showAll ? "Показать меньше" : "Показать больше"}
          >
            {showAll ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

// Добавляем функцию форматирования времени
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}; 