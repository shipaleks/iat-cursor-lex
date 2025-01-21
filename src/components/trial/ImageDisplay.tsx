import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

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
      }}
    >
      <img
        src={imageUrl}
        alt="Stimulus"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          padding: isMobile ? '0.5rem' : '1rem',
        }}
      />
    </Box>
  );
}; 