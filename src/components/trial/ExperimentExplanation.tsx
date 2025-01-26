import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const ExperimentExplanation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'grey.100',
      p: { xs: 2, sm: 3 }
    }}>
      <Paper sx={{ p: 3, mb: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
          Объяснение для респондентов с примерами
        </Typography>

        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Спасибо, что приняли участие в нашем эксперименте! 💡 Давайте расскажем, что вы помогли нам изучить, и приведём несколько примеров.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Что мы изучаем?
        </Typography>
        <Typography paragraph>
          Основная идея эксперимента связана с эффектом прайминга. Это явление, при котором то, что вы видите (например, изображение), может повлиять на скорость вашей реакции на последующее слово.
        </Typography>

        <Typography paragraph>
          Например:
        </Typography>
        <Typography component="ul" sx={{ pl: 4, mb: 3 }}>
          <li>После изображения холодильника вы, вероятно, быстрее распознаете слово «белый», чем слово «чёрный».</li>
          <li>После изображения солнца слово «яркий» воспринимается быстрее, чем «тёмный».</li>
          <li>Если показать лес, слово «зелёный» будет распознано быстрее, чем «синий».</li>
        </Typography>
        <Typography paragraph>
          Эти примеры показывают, как наше мышление автоматически связывает визуальные образы и понятия.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Как работает наш эксперимент?
        </Typography>
        <Typography paragraph>
          Мы использовали изображения, созданные нейросетями, и проверяем, насколько эффективно они вызывают ожидаемые ассоциации. Если изображение хорошо передаёт свою суть (например, холодильник действительно выглядит как холодильник), оно должно активировать связанные ассоциации, что ускорит вашу реакцию на соответствующее слово.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Почему важно отличать настоящие слова от вымышленных?
        </Typography>
        <Typography paragraph>
          Мы просили вас определить, является ли слово настоящим, чтобы вам пришлось внимательно читать каждое слово. Кроме того, это позволяет контролировать, что люди не нажимают на кнопки случайным образом.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Что нам это даёт?
        </Typography>
        <Typography paragraph>
          Сравнивая ваши реакции, мы можем:
        </Typography>
        <Typography component="ul" sx={{ pl: 4 }}>
          <li>Понять, какие визуальные характеристики наиболее выразительны у изображений, созданных нейросетями.</li>
          <li>Улучшить подходы к генерации изображений, чтобы они лучше передавали нужные концепции.</li>
        </Typography>

        <Typography variant="h6" align="center" sx={{ mt: 4, mb: 3 }}>
          Спасибо, что помогли нам лучше понять, как визуальные образы влияют на наше восприятие! 🌟 Ваш вклад — важная часть этого исследования.
        </Typography>

        <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography color="warning.main" align="center">
            Обратите внимание: теперь вы можете продолжить только в тестовом режиме, без записи результатов.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            fullWidth
          >
            Вернуться на главную
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}; 