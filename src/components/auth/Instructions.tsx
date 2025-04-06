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
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        <Typography variant="h6" gutterBottom color="text.primary">
          🎮 Как играть
        </Typography>
        <Typography paragraph color="text.primary">
          Вам будут показаны изображения и слова. Ваша задача — определить, является ли слово настоящим или выдуманным.
          <br /><br />
          Используйте:
          <br />
          → (вправо) = настоящее слово (например, "орден", "красивый")
          <br />
          ← (влево) = выдуманное слово (например, "врлдыб", "монавочно")
          <br /><br />
          <b>Пример:</b> видите слово "гармония" — нажимаете вправо ➡️
          <br />
          Видите слово "кринольно" — нажимаете влево ⬅️
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }} color="text.primary">
          🤖 О чём эта игра
        </Typography>
        <Typography paragraph color="text.primary">
          Каждый ваш ответ помогает тренировать искусственный интеллект. Чем больше раундов вы пройдёте, 
          тем больше баллов заработаете и тем ценнее будет ваш вклад в исследование.
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }} color="text.primary">
          🏆 Рейтинг
        </Typography>
        <Typography paragraph color="text.primary">
          Соревнуйтесь с другими игроками! После каждого раунда смотрите таблицу лидеров.
        </Typography>

        <Typography variant="h6" sx={{ mt: 3 }} color="text.primary">
          ⚡️ Как заработать баллы:
        </Typography>
        <Typography component="div" paragraph color="text.primary">
          • Быстрая реакция
          <br />
          • Точные ответы
          <br />
          • Бонус за каждый новый раунд (+10%)
        </Typography>

        <Typography sx={{ mt: 3 }} color="text.secondary">
          💡 Один раунд длится всего около 1.5 минут. Можно играть сколько угодно раундов!
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 }, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
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