import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface InstructionsProps {
  onStart: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({ onStart }) => {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Typography variant="h5" gutterBottom align="center" sx={{ mb: { xs: 1, sm: 2 } }}>
        Инструкция
      </Typography>
      
      <Box sx={{ flex: 1, mb: { xs: 2, sm: 3 } }}>
        <Typography sx={{ mb: 1 }}>
          В этом эксперименте вам будут показаны изображения и слова.
        </Typography>
        <Typography sx={{ mb: 1 }}>
          Ваша задача - определить, является ли показанное слово настоящим русским словом или нет.
        </Typography>
        <Typography sx={{ mb: 1 }}>
          Порядок выполнения:
        </Typography>
        <Typography component="div" sx={{ pl: 2, mb: 1 }}>
          1. Сначала вы увидите крестик "+" - сфокусируйте на нем взгляд
          <br />
          2. Затем появится изображение - внимательно посмотрите на него
          <br />
          3. После изображения появится слово
          <br />
          4. Вам нужно как можно быстрее решить:
          <Box sx={{ pl: 2, mt: 0.5 }}>
            • Если это настоящее русское слово - нажмите ← (стрелку влево)
            <br />
            • Если это НЕ слово - нажмите → (стрелку вправо)
          </Box>
        </Typography>
        <Typography>
          Старайтесь отвечать быстро и правильно. Ваш результат будет зависеть от точности и скорости ответов.
        </Typography>
      </Box>

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
  );
}; 