import { gearById, RARITY_ORDER } from '../content/gear';
import type { Player, Rarity, Slot } from '../game/types';
import { ART } from './manifest';
import type { Anim, ArtAsset } from './types';

/** Back → front. Every hero image is stacked in this order. */
export const LAYER_ORDER = ['aura', 'accessoryBack', 'legs', 'feet', 'bodyBase', 'body', 'head', 'face', 'hair', 'headGear', 'weapon'] as const;
export type LayerName = (typeof LAYER_ORDER)[number];

const BASE: [LayerName, string][] = [
  ['legs', 'base.legs'],
  ['bodyBase', 'base.body'],
  ['head', 'base.head'],
  ['face', 'base.face'],
  ['hair', 'base.hair'],
];

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

export function heroLayers(p: Player, anim: Anim): HeroLayer[] {
  const out: HeroLayer[] = [];
  const add = (layer: LayerName, artId: string) => {
    const asset = pick(artId, anim);
    if (asset) out.push({ layer, artId, asset });
  };
  for (const [layer, artId] of BASE) add(layer, artId);

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
