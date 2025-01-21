import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { clearAllCollections } from '../../firebase/service';

export function ClearData() {
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClear = async () => {
    try {
      setIsClearing(true);
      setError(null);
      await clearAllCollections();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при очистке данных');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <Button 
        variant="outlined" 
        color="error" 
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
      >
        Очистить данные
      </Button>

      <Dialog open={open} onClose={() => !isClearing && setOpen(false)}>
        <DialogTitle>Подтверждение очистки данных</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.
            Будут удалены:
          </Typography>
          <ul>
            <li>Все сессии</li>
            <li>Весь прогресс участников</li>
            <li>Таблица лидеров</li>
          </ul>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={isClearing}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleClear} 
            color="error" 
            variant="contained"
            disabled={isClearing}
          >
            {isClearing ? 'Очистка...' : 'Очистить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 