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
        overflow: 'auto'
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, flex: 1 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 3 }}>
          Инструкция
        </Typography>

        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
          Цель игры
        </Typography>
        <Typography paragraph>
          Ваша задача — как можно быстрее и точнее определять, является ли показанное слово <strong>настоящим русским словом</strong> или нет. 
          Между словами будут появляться изображения — это сделано специально, чтобы усложнить задачу и сбить вас с толку. 
          Чем лучше вы справитесь с отвлекающими факторами, тем больше очков получите!
        </Typography>

        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
          Процесс игры
        </Typography>
        <Typography paragraph>
          В каждом раунде вы увидите последовательность:
        </Typography>
        <Box sx={{ pl: 2, mb: 2 }}>
          <Typography sx={{ mb: 1 }}>
            1. <strong>Крестик "+"</strong> — сфокусируйте на нём взгляд
          </Typography>
          <Typography sx={{ mb: 1 }}>
            2. <strong>Изображение</strong> — оно появится на короткое время, чтобы отвлечь ваше внимание
          </Typography>
          <Typography>
            3. <strong>Слово</strong> — несмотря на отвлекающие факторы, быстро определите, настоящее оно или нет
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
          Управление
        </Typography>
        <Box sx={{ pl: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <KeyboardArrowLeft color="primary" />
            <Typography sx={{ ml: 1 }}>
              <strong>Левая стрелка</strong> — если это настоящее русское слово
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <KeyboardArrowRight color="primary" />
            <Typography sx={{ ml: 1 }}>
              <strong>Правая стрелка</strong> — если это НЕ слово
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 3 }}>
          Система очков
        </Typography>
        <Typography paragraph>
          • Каждый правильный ответ приносит очки<br />
          • Быстрые ответы дают больше очков<br />
          • Точность выше 90% даёт бонусные очки<br />
          • Ваш результат появится в рейтинге после завершения сессии
        </Typography>

        <Typography variant="body1" sx={{ mt: 3 }} color="text.secondary">
          💡 <em>Совет: Старайтесь отвечать быстро, но не в ущерб точности. Идеальный баланс скорости и точности принесёт максимум очков!</em>
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2, sm: 3 }, borderTop: 1, borderColor: 'divider' }}>
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