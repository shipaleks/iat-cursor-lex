import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

interface InstructionsProps {
  onStart?: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({ onStart }) => {
  const navigate = useNavigate();

  const handleStart = () => {
    if (onStart) {
      onStart();
    }
    navigate('/experiment');
  };

  return (
    <Box p={4} display="flex" flexDirection="column" gap={2}>
      <Typography variant="h4" gutterBottom>
        Инструкция
      </Typography>
      
      <Typography variant="body1" paragraph>
        В этом эксперименте вам будут показаны слова на русском языке. Ваша задача - определить, является ли показанное слово реальным словом русского языка или нет.
      </Typography>

      <Typography variant="body1" paragraph>
        Между словами будут кратко появляться изображения - они служат в качестве разделителей между предъявлениями слов.
      </Typography>

      <Typography variant="body1" paragraph>
        Для ответа используйте:
      </Typography>

      <Box pl={2} display="flex" flexDirection="column" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyboardArrowLeft />
          <Typography variant="body1">
            Стрелка влево - если это настоящее слово русского языка
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <KeyboardArrowRight />
          <Typography variant="body1">
            Стрелка вправо - если это не существующее слово
          </Typography>
        </Box>
      </Box>

      <Typography variant="body1" paragraph mt={2}>
        Старайтесь отвечать как можно быстрее, но при этом правильно. В конце эксперимента вы увидите свои результаты.
      </Typography>

      <Box mt={4} display="flex" justifyContent="center">
        <Button
          variant="contained"
          size="large"
          onClick={handleStart}
        >
          Начать эксперимент
        </Button>
      </Box>
    </Box>
  );
}; 