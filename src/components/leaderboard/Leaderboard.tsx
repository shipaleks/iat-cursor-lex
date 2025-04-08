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
  Collapse,
  SxProps,
  Button
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getLeaderboard } from '../../firebase/service.tsx';
import { LeaderboardEntry as LeaderboardEntryType } from '../../types';

// Функция маскировки никнейма
const maskNickname = (nickname: string): string => {
  if (!nickname || nickname.length <= 3) return nickname;
  return `${nickname.slice(0, 2)}${'*'.repeat(3)}${nickname.slice(-1)}`;
};

// Extend the LeaderboardEntry type for UI purposes
export interface LeaderboardEntry extends LeaderboardEntryType {
  rank?: number;
}

interface LeaderboardProps {
  currentUserNickname?: string;
  sx?: SxProps;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUserNickname, sx }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [loadAttempts, setLoadAttempts] = useState(0); // Счетчик попыток загрузки

  // Автоматическое обновление каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        console.log('[Leaderboard] Loading leaderboard data... (attempt #' + (loadAttempts + 1) + ')');
        const data = await getLeaderboard();
        
        // Увеличиваем счетчик попыток
        setLoadAttempts(prev => prev + 1);
        
        if (!data || data.length === 0) {
          console.warn('[Leaderboard] Received empty data array');
          // Если данных нет после нескольких попыток, добавляем заглушку
          if (loadAttempts >= 2) {
            setLeaderboard([{
              nickname: 'Данные загружаются...',
              score: 0,
              rank: 1,
              totalTimeMs: 0,
              deviceType: 'desktop',
              roundsCompleted: 0
            }]);
            setError('Данные лидерборда загружаются. Сначала завершите один раунд.');
          } else {
            setError('Загрузка данных...');
          }
        } else {
          // Сортируем по убыванию рейтинга и добавляем ранг
          const sortedData = data
            .sort((a, b) => b.score - a.score)
            .map((entry, index) => ({
              ...entry,
              rank: index + 1
            }));
          setLeaderboard(sortedData);
          console.log('[Leaderboard] Loaded', sortedData.length, 'entries');
          setError(null);
          
          if (currentUserNickname) {
            // Ищем пользователя по отображаемому никнейму (не по ID документа)
            // Это важно, так как ID документа может быть нормализованной версией
            const currentUser = sortedData.find(
              entry => entry.nickname.toLowerCase() === currentUserNickname.toLowerCase()
            );
            
            if (currentUser) {
              console.log('[Leaderboard] Current user data:', { 
                nickname: currentUser.nickname,
                rank: currentUser.rank,
                score: currentUser.score,
                rounds: currentUser.roundsCompleted || 0
              });
            } else {
              console.log('[Leaderboard] Current user not found in leaderboard. Looking for:', currentUserNickname);
              console.log('[Leaderboard] Available nicknames:', sortedData.map(e => e.nickname));
            }
          }
        }
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        // Если ошибка повторяется, добавляем более информативное сообщение
        if (loadAttempts > 1) {
          setError('Не удалось загрузить таблицу лидеров. Пожалуйста, завершите один раунд, чтобы увидеть свои результаты.');
          // Добавляем заглушку после нескольких неудачных попыток
          setLeaderboard([{
            nickname: 'Недоступно',
            score: 0,
            rank: 1,
            totalTimeMs: 0,
            deviceType: 'desktop',
            roundsCompleted: 0
          }]);
        } else {
          setError('Не удалось загрузить таблицу лидеров');
        }
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [currentUserNickname, lastUpdate, loadAttempts]); // Перезагружаем при изменении никнейма или lastUpdate

  if (loading && loadAttempts <= 1) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <Typography>Загрузка результатов...</Typography>
      </Box>
    );
  }

  if (error && leaderboard.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={3}>
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setLastUpdate(Date.now())}
          sx={{ mt: 1 }}
        >
          Обновить
        </Button>
      </Box>
    );
  }

  // Если и после загрузки нет данных, показываем сообщение
  if (leaderboard.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={3}>
        <Typography color="text.secondary">
          Пока нет данных в таблице лидеров. Завершите один раунд, чтобы увидеть свои результаты.
        </Typography>
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
    <Box sx={{ width: '100%', mb: 4, ...sx }}>
      <Typography variant="h5" gutterBottom align="center">
        Лидерборд
      </Typography>

      {error && (
        <Box sx={{ mb: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="body2" align="center" color="warning.contrastText">
            {error}
          </Typography>
        </Box>
      )}

      {currentUser && !isCurrentUserInTop5 && !showAll && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.main', borderRadius: 1 }}>
          <Typography variant="body2" align="center" sx={{ color: 'white' }}>
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
              <TableCell>Раунды</TableCell>
              <TableCell>Точность</TableCell>
              <TableCell>Среднее время</TableCell>
              <TableCell>Устройство</TableCell>
              <TableCell>Счёт</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedEntries.map((entry) => (
              <TableRow 
                key={entry.nickname} 
                className={entry.nickname === currentUserNickname ? 'current-user' : ''}
              >
                <TableCell>{entry.rank}</TableCell>
                <TableCell>
                  {entry.nickname === currentUserNickname ? entry.nickname : maskNickname(entry.nickname)}
                </TableCell>
                <TableCell>
                  {entry.roundsCompleted || 0}
                </TableCell>
                <TableCell>
                  {entry.ratingDetails?.accuracy !== undefined ? entry.ratingDetails.accuracy.toFixed(1) : '0.0'}%
                </TableCell>
                <TableCell>
                  {formatTime(entry.totalTimeMs)}
                </TableCell>
                <TableCell>
                  {entry.deviceType === 'mobile' ? 'Мобильное' : 'Настольное'}
                </TableCell>
                <TableCell>
                  {entry.score !== undefined ? entry.score.toFixed(0) : '0'}
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

      {/* Добавляем возможность принудительного обновления */}
      <Box display="flex" justifyContent="center" mt={2}>
        <Button 
          variant="text" 
          size="small" 
          onClick={() => setLastUpdate(Date.now())}
          sx={{ fontSize: '0.75rem' }}
        >
          Обновить результаты
        </Button>
      </Box>
    </Box>
  );
};

// Добавляем функцию форматирования времени
const formatTime = (ms: number | undefined | null): string => {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}; 