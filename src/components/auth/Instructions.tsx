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
        <Typography variant="h5" gutterBottom>
          Инструкция
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          Цель игры
        </Typography>
        <Typography paragraph>
          Ваша задача - как можно быстрее и точнее определять, является ли показанное слово правильным русским словом или нет.
          Чем быстрее и точнее вы отвечаете, тем больше очков получаете.
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          Процесс игры
        </Typography>
        <Typography paragraph>
          В ходе игры вам будут показаны изображения и слова. Между словами будут появляться изображения, 
          которые могут отвлекать внимание - умение справляться с этими отвлечениями принесет вам дополнительные очки.
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          Управление
        </Typography>
        <Typography paragraph>
          Используйте клавиши со стрелками для ответа:
          <br />
          ← (влево) = "Это НЕ слово"
          <br />
          → (вправо) = "Это настоящее слово"
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          Длительность
        </Typography>
        <Typography paragraph>
          Одна сессия занимает примерно 10 минут. Рекомендуется делать перерыв между сессиями и не проходить их подряд,
          чтобы сохранять концентрацию и давать точные ответы.
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          Система очков
        </Typography>
        <Typography paragraph>
          Очки начисляются за:
          <br />
          • Правильное определение настоящих и ненастоящих слов
          <br />
          • Скорость реакции
          <br />
          • Способность не отвлекаться на изображения
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