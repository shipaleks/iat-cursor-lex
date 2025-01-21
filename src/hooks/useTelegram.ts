const webAppData = (window as any).Telegram?.WebApp;

export function useTelegram() {
  const isTelegram = Boolean(webAppData);
  const tg = isTelegram ? webAppData : {
    ready: () => {},
    close: () => {},
    MainButton: {
      isVisible: false,
      show: () => {},
      hide: () => {}
    },
    initDataUnsafe: { user: null },
    colorScheme: 'light'
  };

  const onClose = () => {
    if (isTelegram) {
      tg.close();
    }
  };

  const onToggleButton = () => {
    if (isTelegram) {
      if (tg.MainButton.isVisible) {
        tg.MainButton.hide();
      } else {
        tg.MainButton.show();
      }
    }
  };

  return {
    tg,
    user: tg.initDataUnsafe?.user,
    onClose,
    onToggleButton,
    isTelegram
  };
} 