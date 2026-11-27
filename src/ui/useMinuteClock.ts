import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Current time, refreshed every minute and whenever the app returns to the foreground. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);
  return now;
}
