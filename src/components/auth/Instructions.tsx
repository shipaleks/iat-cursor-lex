import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

interface InstructionsProps {
  onStart: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({ onStart }) => {
  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        bgcolor: 'grey.100'
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        <Typography variant="h6" gutterBottom>
          🎮 Как играть
        </Typography>
        <Typography paragraph>
          Определите, является ли показанное слово настоящим.
          <br /><br />
          Используйте стрелки на клавиатуре или кнопки на экране:
          <br /><br />
          → (вправо) = настоящее слово
          <br />
          ← (влево) = выдуманное слово

          <br /><br />
          Чем быстрее и точнее отвечаете, тем больше очков получаете!
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }}>
          🤖 Важно!
        </Typography>
        <Typography paragraph>
          Каждый ваш ответ помогает тренировать искусственный интеллект. Чем больше раундов вы пройдёте (всего их 20), 
          тем больше баллов заработаете и тем ценнее будет ваш вклад! После прохождения всех раундов вы получите подробное объяснение эксперимента.
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }}>
          🏆 Соревнование
        </Typography>
        <Typography paragraph>
          Вы соревнуетесь с другими игроками! После каждого раунда смотрите таблицу лидеров — может быть, 
          именно вы займёте первое место?
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }}>
          ⚡️ Баллы начисляются за:
        </Typography>
        <Typography component="div" paragraph>
          • Скорость реакции
          <br />
          • Точность ответов
          <br />
          • Количество пройденных раундов
        </Typography>

        <Typography sx={{ mt: 3 }} color="text.secondary">
          💡 Совет: Один раунд длится примерно 3 минуты. Делайте перерывы между раундами, чтобы сохранять высокую скорость реакции!
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 }, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.100' }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          onClick={onStart}
        >
          Начать
        </Button>
      </Box>
    </Box>
  );
}; 