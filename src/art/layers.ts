import { gearById, RARITY_ORDER } from '../content/gear';
import type { Look, Player, Pronouns, Rarity, Slot } from '../game/types';
import { ART } from './manifest';
import type { Anim, ArtAsset } from './types';

/** Back → front. Every hero image is stacked in this order. */
export const LAYER_ORDER = ['aura', 'accessoryBack', 'legs', 'feet', 'bodyBase', 'body', 'head', 'face', 'hair', 'headGear', 'weapon'] as const;
export type LayerName = (typeof LAYER_ORDER)[number];

/** The base body, built from the character's look (Customize screen). */
export type Appearance = { look: Look; pronouns: Pronouns };
export const DEFAULT_APPEARANCE: Appearance = {
  look: { skin: 'tan', hairStyle: 'short', hairColor: 'brown', eyes: 'dark', ears: 'round' },
  pronouns: 'they',
};

function baseLayers({ look, pronouns }: Appearance): [LayerName, string][] {
  return [
    ['legs', 'base.legs'],
    ['bodyBase', `base.body.${look.skin}`],
    ['head', `base.head.${look.skin}.${look.ears}`],
    ['face', `base.face.${look.eyes}.${pronouns === 'she' ? 'lashes' : 'plain'}`],
    ['hair', `base.hair.${look.hairStyle}.${look.hairColor}`],
  ];
}

const SLOT_LAYER: Record<Slot, LayerName> = {
  weapon: 'weapon',
  head: 'headGear',
  body: 'body',
  feet: 'feet',
  accessory: 'accessoryBack',
};

const AURA_FROM: Rarity = 'rare';

export interface HeroLayer {
  layer: LayerName;
  artId: string;
  asset: ArtAsset;
}

function pick(artId: string, anim: Anim): ArtAsset | undefined {
  const entry = ART[artId];
  return entry?.[anim] ?? entry?.idle;
}

export function heroLayers(p: Player, anim: Anim, appearance: Appearance = DEFAULT_APPEARANCE): HeroLayer[] {
  const out: HeroLayer[] = [];
  const add = (layer: LayerName, artId: string) => {
    const asset = pick(artId, anim);
    if (asset) out.push({ layer, artId, asset });
  };
  for (const [layer, artId] of baseLayers(appearance)) add(layer, artId);

  let best = -1;
  for (const [slot, uid] of Object.entries(p.equipped) as [Slot, string][]) {
    const def = gearById(p.inventory.find((i) => i.uid === uid)?.gearId ?? '');
    if (!def) continue;
    add(SLOT_LAYER[slot], def.art);
    best = Math.max(best, RARITY_ORDER.indexOf(def.rarity));
  }
  if (best >= RARITY_ORDER.indexOf(AURA_FROM)) add('aura', `fx.aura.${RARITY_ORDER[best]}`);

  return out.sort((a, b) => LAYER_ORDER.indexOf(a.layer) - LAYER_ORDER.indexOf(b.layer));
}
