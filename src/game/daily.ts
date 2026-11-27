import { DAILY_POOL } from '../content/shop';
import { dayKey } from './dates';
import { seededRng } from './rng';
import type { SaveData } from './types';

/** Makes today's three quests if they are missing or from another day. */
export function ensureDaily(s: SaveData, now: Date): SaveData {
  const key = dayKey(now);
  if (s.daily.dayKey === key) return s;
  const rng = seededRng(`daily-${key}`);
  const pool = [...DAILY_POOL];
  const quests = Array.from({ length: 3 }, () => {
    const t = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    return { id: `${key}-${t.kind}`, kind: t.kind, event: t.event, title: t.title, target: t.target, progress: 0, reward: t.reward, claimed: false };
  });
  return { ...s, daily: { dayKey: key, quests } };
}

/** Counts an action toward today's quests (matched by event or kind). */
export function progressDaily(s: SaveData, eventOrKind: string, now: Date, n = 1): SaveData {
  const t = ensureDaily(s, now);
  const quests = t.daily.quests.map((q) =>
    q.event === eventOrKind || q.kind === eventOrKind ? { ...q, progress: Math.min(q.target, q.progress + n) } : q,
  );
  return { ...t, daily: { ...t.daily, quests } };
}

export function claimDaily(s: SaveData, id: string): SaveData {
  const q = s.daily.quests.find((x) => x.id === id);
  if (!q || q.claimed || q.progress < q.target) return s;
  return {
    ...s,
    player: { ...s.player, gold: s.player.gold + q.reward },
    daily: { ...s.daily, quests: s.daily.quests.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
  };
}

/** Habit quests track how many habits are done today, so undoing takes progress back too. */
export function syncHabitDaily(s: SaveData, now: Date): SaveData {
  const t = ensureDaily(s, now);
  const done = t.completions.filter((c) => c.dayKey === t.daily.dayKey).length;
  const quests = t.daily.quests.map((q) => (q.event === 'habit' && !q.claimed ? { ...q, progress: Math.min(q.target, done) } : q));
  return { ...t, daily: { ...t.daily, quests } };
}
