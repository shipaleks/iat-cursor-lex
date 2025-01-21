import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface InstructionsProps {
  onStart: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({ onStart }) => {
  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: '100%',
        position: 'relative'
      }}
    >
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center">
          Инструкция
        </Typography>
        
        {/* Контент с инструкциями */}
        <Box sx={{ mb: 4 }}>
          <Typography paragraph>
            В этом эксперименте вам будут показаны изображения и слова.
          </Typography>
          <Typography paragraph>
            Ваша задача - определить, является ли показанное слово настоящим русским словом или нет.
          </Typography>
          <Typography paragraph>
            Порядок выполнения:
          </Typography>
          <Typography component="div" sx={{ pl: 2 }}>
            1. Сначала вы увидите крестик "+" - сфокусируйте на нем взгляд
            <br />
            2. Затем появится изображение - внимательно посмотрите на него
            <br />
            3. После изображения появится слово
            <br />
            4. Вам нужно как можно быстрее решить:
            <Box sx={{ pl: 3, mt: 1 }}>
              • Если это настоящее русское слово - нажмите ← (стрелку влево)
              <br />
              • Если это НЕ слово - нажмите → (стрелку вправо)
            </Box>
          </Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            Старайтесь отвечать быстро и правильно. Ваш результат будет зависеть от точности и скорости ответов.
          </Typography>
        </Box>
      </Box>

      {/* Кнопка всегда видна внизу */}
      <Box sx={{ 
        pt: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onStart}
          size="large"
        >
          Начать
        </Button>
      </Box>
    </Box>
  );
}; 