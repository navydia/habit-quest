import type { Slot } from '../game/types';

export const SLOT_INFO: Record<Slot, { name: string; emoji: string }> = {
  weapon: { name: 'Weapon', emoji: '⚔️' },
  head: { name: 'Head', emoji: '🪖' },
  body: { name: 'Body', emoji: '👕' },
  feet: { name: 'Feet', emoji: '👢' },
  accessory: { name: 'Accessory', emoji: '📿' },
};
