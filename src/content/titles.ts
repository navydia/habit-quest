import { lifetimeStats } from '../game/lifetime';
import type { SaveData } from '../game/types';

export interface TitleDef {
  id: string;
  name: string;
  how: string;
  earned: (s: SaveData) => boolean;
}

/** Titles are earned by adventuring, bossing, events and achievements. Event titles can be added here later. */
export const TITLES: TitleDef[] = [
  { id: 'wanderer', name: 'the Wanderer', how: 'Where every story starts.', earned: () => true },
  { id: 'slime-wrangler', name: 'Slime Wrangler', how: 'Win your first adventure.', earned: (s) => lifetimeStats(s).adventuresCompleted >= 1 },
  { id: 'seasoned', name: 'the Seasoned', how: 'Win 10 adventures.', earned: (s) => lifetimeStats(s).adventuresCompleted >= 10 },
  { id: 'boss-breaker', name: 'Boss Breaker', how: 'Beat your first boss.', earned: (s) => lifetimeStats(s).bossesBeaten >= 1 },
  { id: 'dragonslayer', name: 'Dragonslayer', how: 'Beat the Cinder Drake.', earned: (s) => s.questLog.some((r) => r.boss?.success && r.boss.bossId === 'cinder-drake') },
  { id: 'cartographer', name: 'the Cartographer', how: 'Explore 3 regions.', earned: (s) => lifetimeStats(s).regionsExplored >= 3 },
  { id: 'habit-hero', name: 'Habit Hero', how: 'Complete 100 habits.', earned: (s) => lifetimeStats(s).habitsCompleted >= 100 },
  { id: 'collector', name: 'the Collector', how: 'Find 6 mementos.', earned: (s) => lifetimeStats(s).mementos >= 6 },
  {
    id: 'early-bird',
    name: 'Early Bird',
    how: 'Complete 20 morning habits.',
    earned: (s) => s.completions.filter((c) => s.habits.find((h) => h.id === c.habitId)?.timeOfDay === 'morning').length >= 20,
  },
];

export const titleById = (id: string) => TITLES.find((t) => t.id === id);
export const earnedTitles = (s: SaveData) => TITLES.filter((t) => t.earned(s));
