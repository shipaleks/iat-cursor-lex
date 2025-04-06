import React from 'react';
import { Box, useTheme, useMediaQuery, Paper } from '@mui/material';

interface ImageDisplayProps {
  imageUrl: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl }) => {
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
        overflow: 'hidden',
        padding: { xs: '0.5rem', sm: '1rem' },
      }}
    >
      <Paper
        elevation={4}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 1,
          backgroundColor: 'rgba(30, 30, 30, 0.7)',  // Dark translucent background instead of white
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: theme.palette.mode === 'dark' ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
          maxWidth: '95vw',
          maxHeight: '80vh',
          [theme.breakpoints.up('md')]: {
            maxWidth: '70vw',
            maxHeight: '70vh'
          }
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt="Stimulus"
          sx={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '4px',
          }}
        />
      </Paper>
    </Box>
  );
}; 