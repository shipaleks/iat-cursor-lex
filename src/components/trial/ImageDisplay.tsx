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
        padding: { xs: '0.5rem', sm: '1rem' },
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
          borderRadius: '8px',
        }}
      />
    </Box>
  );
}; 