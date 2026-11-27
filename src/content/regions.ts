import type { Difficulty } from '../game/types';

export interface Memento {
  id: string;
  name: string;
  description: string;
}

/** An adventure in a region. `id` matches a quest template (story + flavour) in quests.ts. */
export interface AdventureDef {
  id: string;
  difficulty: Difficulty;
  requiredPower: number;
  memento: Memento;
}

export interface FamiliarDef {
  id: string;
  name: string;
  description: string;
  bonus: { kind: 'exp' | 'gold'; pct: number };
}

export interface BossDef {
  id: string;
  name: string;
  flavour: string;
  requiredPower: number;
  familiar: FamiliarDef;
}

export interface RegionDef {
  id: string;
  name: string;
  blurb: string;
  minPower: number;
  rewardScale: number;
  adventures: [AdventureDef, AdventureDef, AdventureDef];
  boss: BossDef;
  /** Event regions only: ISO dates. */
  availableFrom?: string;
  availableUntil?: string;
}

export const REGIONS: RegionDef[] = [
  {
    id: 'thornwick-meadows',
    name: 'Thornwick Meadows',
    blurb: 'Rolling fields, stone walls and a great many slimes.',
    minPower: 0,
    rewardScale: 1,
    adventures: [
      { id: 'slime-patrol', difficulty: 'easy', requiredPower: 90, memento: { id: 'plum-jam-jar', name: 'Empty Jam Jar', description: 'The farmer\'s plum jam. It did not survive the walk home.' } },
      { id: 'herb-gathering', difficulty: 'normal', requiredPower: 120, memento: { id: 'pressed-moonleaf', name: 'Pressed Moonleaf', description: 'A sprig from past the ford, dried flat between two pages.' } },
      { id: 'missing-goat', difficulty: 'hard', requiredPower: 160, memento: { id: 'chewed-key', name: 'Slightly Chewed Key', description: 'Benna had a copy made. She let you keep the original.' } },
    ],
    boss: {
      id: 'old-bramblehide',
      name: 'Old Bramblehide',
      flavour: 'A hedgehog the size of a haystack, and twice as prickly.',
      requiredPower: 140,
      familiar: { id: 'hoglet', name: 'Hoglet', description: 'A small, polite hedgehog who rolls into a ball when complimented.', bonus: { kind: 'gold', pct: 3 } },
    },
  },
  {
    id: 'willowmere-marsh',
    name: 'Willowmere Marsh',
    blurb: 'Reeds, mist and lights that are not always lanterns.',
    minPower: 130,
    rewardScale: 1.5,
    adventures: [
      { id: 'lost-lantern', difficulty: 'easy', requiredPower: 150, memento: { id: 'heron-feather', name: 'Heron Feather', description: 'Given in exchange for one sardine. A fair trade.' } },
      { id: 'wisp-lights', difficulty: 'normal', requiredPower: 185, memento: { id: 'wisp-whistle', name: 'Wisp Whistle', description: 'Two notes, low then high. The lights still answer.' } },
      { id: 'bell-tower', difficulty: 'hard', requiredPower: 225, memento: { id: 'owl-feather', name: 'Owlet Down', description: 'A soft grey feather from the bell tower\'s newest residents.' } },
    ],
    boss: {
      id: 'mire-witch',
      name: 'The Mire Witch',
      flavour: 'She brews in the deep pools and does not like visitors.',
      requiredPower: 205,
      familiar: { id: 'bog-toad', name: 'Bog Toad', description: 'Croaks once at sunrise, once at sunset, and never in between.', bonus: { kind: 'exp', pct: 4 } },
    },
  },
  {
    id: 'greystone-hills',
    name: 'Greystone Hills',
    blurb: 'Steep paths, old forts and caves that echo back.',
    minPower: 190,
    rewardScale: 2.2,
    adventures: [
      { id: 'courier-run', difficulty: 'easy', requiredPower: 210, memento: { id: 'wedding-invite', name: 'Wedding Invitation', description: 'You went. The cake was excellent.' } },
      { id: 'mill-rats', difficulty: 'normal', requiredPower: 245, memento: { id: 'barley-cake', name: 'Barley Cake Token', description: 'Good for one cake, Sundays only, by arrangement with a very old rat.' } },
      { id: 'cave-survey', difficulty: 'hard', requiredPower: 290, memento: { id: 'echo-map', name: 'The Echo Map', description: 'A copy of the framed one. Yours has a coffee ring.' } },
    ],
    boss: {
      id: 'granite-king',
      name: 'The Granite King',
      flavour: 'A troll who sat down three hundred years ago and has only just stood up.',
      requiredPower: 275,
      familiar: { id: 'pebble-sprite', name: 'Pebble Sprite', description: 'A tiny stone friend who hums when it is happy.', bonus: { kind: 'gold', pct: 5 } },
    },
  },
  {
    id: 'emberpeak-pass',
    name: 'Emberpeak Pass',
    blurb: 'A high road between warm mountains. Watch for smoke.',
    minPower: 250,
    rewardScale: 3,
    adventures: [
      { id: 'caravan-guard', difficulty: 'easy', requiredPower: 270, memento: { id: 'saffron-pouch', name: 'Saffron Pouch', description: 'A thank-you from the caravan cook. It smells like supper.' } },
      { id: 'bridge-toll', difficulty: 'normal', requiredPower: 310, memento: { id: 'riddle-card', name: 'Riddle Club Card', description: 'Lifetime member. The troll signed it twice.' } },
      { id: 'ruin-relic', difficulty: 'hard', requiredPower: 360, memento: { id: 'carved-stone', name: 'Carving Sketch', description: 'The scholar kept the stone. You kept the first sketch.' } },
    ],
    boss: {
      id: 'cinder-drake',
      name: 'The Cinder Drake',
      flavour: 'Small for a dragon. Very large for anything else.',
      requiredPower: 345,
      familiar: { id: 'ember-wyrmling', name: 'Ember Wyrmling', description: 'Warm, curious and fond of sitting on your shoulder.', bonus: { kind: 'exp', pct: 6 } },
    },
  },
];

export const regionById = (id: string) => REGIONS.find((r) => r.id === id);
export const bossById = (id: string) => REGIONS.find((r) => r.boss.id === id)?.boss;
export const regionOfBoss = (bossId: string) => REGIONS.find((r) => r.boss.id === bossId);
export const familiarById = (id: string) => REGIONS.find((r) => r.boss.familiar.id === id)?.boss.familiar;
