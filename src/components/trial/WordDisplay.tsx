import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

interface WordDisplayProps {
  word: string;
  color?: 'default' | 'success.main' | 'error.main';
}

export const WordDisplay: React.FC<WordDisplayProps> = ({ word, color = 'default' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: isMobile ? 2 : 4,
      }}
    >
      <Typography
        variant={isMobile ? "h3" : "h2"}
        component="div"
        align="center"
        sx={{
          fontWeight: 300,
          letterSpacing: 2,
          userSelect: 'none',
          wordBreak: 'break-word',
          maxWidth: '100%',
          color: color,
          transition: 'color 0.2s ease',
        }}
      >
        {word}
      </Typography>
    </Box>
  );
}; 