import type { Rarity } from '../game/types';

export const GEAR_PRICE: Record<Rarity, number> = { common: 60, uncommon: 150, rare: 350, epic: 800, legendary: 1800 };
export const PREMIUM_MARKUP = 1.5;
export const ARMORY_SLOTS = 4;

export type PotionId = 'fortune' | 'swift' | 'courage';
export interface PotionDef {
  id: PotionId;
  name: string;
  emoji: string;
  description: string;
  price: number;
  effect: { luck?: number; timeMult?: number; power?: number };
}

/** One-use potions: drink one and it boosts your next adventure or boss fight. */
export const POTIONS: PotionDef[] = [
  { id: 'fortune', name: 'Fortune Draught', emoji: '🍀', description: '+10 Luck on your next trip: better drops and familiar chances.', price: 80, effect: { luck: 10 } },
  { id: 'swift', name: 'Swift Tonic', emoji: '💨', description: 'Your next trip takes 15% less time.', price: 80, effect: { timeMult: 0.85 } },
  { id: 'courage', name: 'Courage Brew', emoji: '🔥', description: '+40 power on your next trip.', price: 120, effect: { power: 40 } },
];
export const potionById = (id: string) => POTIONS.find((p) => p.id === id);

export type DailyEvent = 'adventure' | 'habit' | 'buy' | 'potion' | 'equip' | 'sp';
export interface DailyTemplate {
  kind: string;
  event: DailyEvent;
  title: string;
  target: number;
  reward: number;
}

export const DAILY_POOL: DailyTemplate[] = [
  { kind: 'adventure', event: 'adventure', title: 'Complete an adventure', target: 1, reward: 60 },
  { kind: 'habit3', event: 'habit', title: 'Complete 3 habits', target: 3, reward: 40 },
  { kind: 'habit5', event: 'habit', title: 'Complete 5 habits', target: 5, reward: 70 },
  { kind: 'buy', event: 'buy', title: 'Buy an item in the Shop', target: 1, reward: 50 },
  { kind: 'potion', event: 'potion', title: 'Drink a potion', target: 1, reward: 50 },
  { kind: 'equip', event: 'equip', title: 'Equip a piece of gear', target: 1, reward: 40 },
  { kind: 'sp', event: 'sp', title: 'Spend a skill point', target: 1, reward: 40 },
];
