import { clockNow } from '@/src/game/clock';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useGameStore } from '@/src/store/gameStore';

/** Current time, refreshed every minute and whenever the app returns to the foreground. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => clockNow());
  // Debug time skips change the offset: refresh at once so screens use the new day.
  const offset = useGameStore((s) => s.save.dev?.offsetMs ?? 0);
  const [seen, setSeen] = useState(offset);
  if (seen !== offset) {
    setSeen(offset);
    setNow(clockNow());
  }
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
