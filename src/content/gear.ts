import type { Rarity, Slot, Stats, WeaponType } from '../game/types';

export interface GearDef {
  id: string;
  name: string;
  slot: Slot;
  rarity: Rarity;
  weaponType?: WeaponType;
  stats: Partial<Stats>;
  /** Art id in src/art/manifest.ts. */
  art: string;
}

/** Total stat points an item of each rarity carries. */
export const RARITY_BUDGET: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 4, epic: 6, legendary: 9 };
export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const RARITY_LABEL: Record<Rarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

const g = (id: string, name: string, slot: Slot, rarity: Rarity, stats: Partial<Stats>, weaponType?: WeaponType): GearDef => ({
  id, name, slot, rarity, stats, weaponType, art: `gear.${id}`,
});

export const GEAR: GearDef[] = [
  // weapons
  g('wooden-sword', 'Wooden Sword', 'weapon', 'common', { power: 1 }, 'sword'),
  g('iron-sword', 'Iron Sword', 'weapon', 'uncommon', { power: 2 }, 'sword'),
  g('emberforged-blade', 'Emberforged Blade', 'weapon', 'legendary', { power: 5, speed: 4 }, 'sword'),
  g('hunting-bow', 'Hunting Bow', 'weapon', 'common', { speed: 1 }, 'bow'),
  g('oakheart-bow', 'Oakheart Bow', 'weapon', 'uncommon', { luck: 1, speed: 1 }, 'bow'),
  g('yew-longbow', 'Yew Longbow', 'weapon', 'rare', { power: 2, speed: 2 }, 'bow'),
  g('apprentice-staff', 'Apprentice Staff', 'weapon', 'common', { luck: 1 }, 'staff'),
  g('runed-staff', 'Runed Staff', 'weapon', 'uncommon', { defense: 1, luck: 1 }, 'staff'),
  g('moonlit-staff', 'Moonlit Staff', 'weapon', 'epic', { luck: 3, power: 3 }, 'staff'),
  // head
  g('leather-cap', 'Leather Cap', 'head', 'common', { defense: 1 }),
  g('ranger-hood', 'Ranger Hood', 'head', 'uncommon', { speed: 1, luck: 1 }),
  g('iron-helm', 'Iron Helm', 'head', 'rare', { defense: 3, power: 1 }),
  g('circlet-of-stars', 'Circlet of Stars', 'head', 'legendary', { luck: 5, defense: 4 }),
  // body
  g('travellers-tunic', "Traveller's Tunic", 'body', 'common', { defense: 1 }),
  g('padded-jerkin', 'Padded Jerkin', 'body', 'uncommon', { defense: 2 }),
  g('chainmail', 'Chainmail', 'body', 'rare', { defense: 3, power: 1 }),
  g('wardens-plate', "Warden's Plate", 'body', 'epic', { defense: 4, power: 2 }),
  // feet
  g('worn-boots', 'Worn Boots', 'feet', 'common', { speed: 1 }),
  g('soft-boots', 'Soft Boots', 'feet', 'uncommon', { speed: 2 }),
  g('windstep-boots', 'Windstep Boots', 'feet', 'rare', { speed: 3, luck: 1 }),
  // accessory
  g('lucky-pebble', 'Lucky Pebble', 'accessory', 'common', { luck: 1 }),
  g('travel-cloak', 'Travel Cloak', 'accessory', 'uncommon', { defense: 1, speed: 1 }),
  g('fox-charm', 'Fox Charm', 'accessory', 'rare', { luck: 4 }),
  g('dragonscale-cloak', 'Dragonscale Cloak', 'accessory', 'epic', { defense: 3, speed: 3 }),
];

export const gearById = (id: string): GearDef | undefined => GEAR.find((x) => x.id === id);
