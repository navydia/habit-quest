import { clockNow } from '@/src/game/clock';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Current time, refreshed every minute and whenever the app returns to the foreground. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => clockNow());
  useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(clockNow());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  return now;
}
