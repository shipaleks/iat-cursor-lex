import { Typography } from '@mui/material';

interface WordDisplayProps {
  word: string;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({ word }) => {
  return (
    <Typography
      variant="body1"
      sx={{
        fontSize: '16px !important',
        fontWeight: 400,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        width: '100%',
        display: 'block',
      }}
    >
      {word}
    </Typography>
  );
}; 