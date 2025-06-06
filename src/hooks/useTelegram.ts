import { useEffect, useState } from 'react';

export const useTelegram = () => {
  const [tg, setTg] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const app = window.Telegram.WebApp;
      setTg(app);
      setUser(app.initDataUnsafe?.user);
      
      app.ready();
      app.expand();
      
      // Настройка темы
      document.body.style.backgroundColor = app.backgroundColor;
      if (app.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const closeMiniApp = () => {
    tg?.close();
  };

  const sendData = (data: object) => {
    tg?.sendData(JSON.stringify(data));
  };

  return {
    tg,
    user,
    closeMiniApp,
    sendData,
  };
};