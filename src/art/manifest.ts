// Art manifest: one entry per art id. See docs/art/art-spec.md.
// To use your own art, replace the PNG. If its frame count changes, update `frames` here.
import type { ArtAsset, Anim } from './types';

export const ART: Record<string, Partial<Record<Anim, ArtAsset>>> = {
  'base.legs': {
    idle: { src: require('../../assets/art/base.legs/idle.png'), frames: 1, fps: 1 },
  },
  'gear.travellers-tunic': {
    idle: { src: require('../../assets/art/gear.travellers-tunic/idle.png'), frames: 1, fps: 1 },
  },
  'gear.padded-jerkin': {
    idle: { src: require('../../assets/art/gear.padded-jerkin/idle.png'), frames: 1, fps: 1 },
  },
  'gear.chainmail': {
    idle: { src: require('../../assets/art/gear.chainmail/idle.png'), frames: 1, fps: 1 },
  },
  'gear.wardens-plate': {
    idle: { src: require('../../assets/art/gear.wardens-plate/idle.png'), frames: 1, fps: 1 },
  },
  'gear.leather-cap': {
    idle: { src: require('../../assets/art/gear.leather-cap/idle.png'), frames: 1, fps: 1 },
  },
  'gear.ranger-hood': {
    idle: { src: require('../../assets/art/gear.ranger-hood/idle.png'), frames: 1, fps: 1 },
  },
  'gear.iron-helm': {
    idle: { src: require('../../assets/art/gear.iron-helm/idle.png'), frames: 1, fps: 1 },
  },
  'gear.circlet-of-stars': {
    idle: { src: require('../../assets/art/gear.circlet-of-stars/idle.png'), frames: 1, fps: 1 },
  },
  'gear.worn-boots': {
    idle: { src: require('../../assets/art/gear.worn-boots/idle.png'), frames: 1, fps: 1 },
  },
  'gear.soft-boots': {
    idle: { src: require('../../assets/art/gear.soft-boots/idle.png'), frames: 1, fps: 1 },
  },
  'gear.windstep-boots': {
    idle: { src: require('../../assets/art/gear.windstep-boots/idle.png'), frames: 1, fps: 1 },
  },
  'gear.lucky-pebble': {
    idle: { src: require('../../assets/art/gear.lucky-pebble/idle.png'), frames: 1, fps: 1 },
  },
  'gear.travel-cloak': {
    idle: { src: require('../../assets/art/gear.travel-cloak/idle.png'), frames: 1, fps: 1 },
  },
  'gear.fox-charm': {
    idle: { src: require('../../assets/art/gear.fox-charm/idle.png'), frames: 1, fps: 1 },
  },
  'gear.dragonscale-cloak': {
    idle: { src: require('../../assets/art/gear.dragonscale-cloak/idle.png'), frames: 1, fps: 1 },
  },
  'base.body.fair': {
    idle: { src: require('../../assets/art/base.body.fair/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.fair.round': {
    idle: { src: require('../../assets/art/base.head.fair.round/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.fair.pointed': {
    idle: { src: require('../../assets/art/base.head.fair.pointed/idle.png'), frames: 1, fps: 1 },
  },
  'base.body.light': {
    idle: { src: require('../../assets/art/base.body.light/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.light.round': {
    idle: { src: require('../../assets/art/base.head.light.round/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.light.pointed': {
    idle: { src: require('../../assets/art/base.head.light.pointed/idle.png'), frames: 1, fps: 1 },
  },
  'base.body.tan': {
    idle: { src: require('../../assets/art/base.body.tan/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.tan.round': {
    idle: { src: require('../../assets/art/base.head.tan.round/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.tan.pointed': {
    idle: { src: require('../../assets/art/base.head.tan.pointed/idle.png'), frames: 1, fps: 1 },
  },
  'base.body.brown': {
    idle: { src: require('../../assets/art/base.body.brown/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.brown.round': {
    idle: { src: require('../../assets/art/base.head.brown.round/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.brown.pointed': {
    idle: { src: require('../../assets/art/base.head.brown.pointed/idle.png'), frames: 1, fps: 1 },
  },
  'base.body.deep': {
    idle: { src: require('../../assets/art/base.body.deep/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.deep.round': {
    idle: { src: require('../../assets/art/base.head.deep.round/idle.png'), frames: 1, fps: 1 },
  },
  'base.head.deep.pointed': {
    idle: { src: require('../../assets/art/base.head.deep.pointed/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.short.black': {
    idle: { src: require('../../assets/art/base.hair.short.black/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.short.brown': {
    idle: { src: require('../../assets/art/base.hair.short.brown/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.short.auburn': {
    idle: { src: require('../../assets/art/base.hair.short.auburn/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.short.blonde': {
    idle: { src: require('../../assets/art/base.hair.short.blonde/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.short.silver': {
    idle: { src: require('../../assets/art/base.hair.short.silver/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.short.teal': {
    idle: { src: require('../../assets/art/base.hair.short.teal/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.long.black': {
    idle: { src: require('../../assets/art/base.hair.long.black/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.long.brown': {
    idle: { src: require('../../assets/art/base.hair.long.brown/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.long.auburn': {
    idle: { src: require('../../assets/art/base.hair.long.auburn/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.long.blonde': {
    idle: { src: require('../../assets/art/base.hair.long.blonde/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.long.silver': {
    idle: { src: require('../../assets/art/base.hair.long.silver/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.long.teal': {
    idle: { src: require('../../assets/art/base.hair.long.teal/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.curly.black': {
    idle: { src: require('../../assets/art/base.hair.curly.black/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.curly.brown': {
    idle: { src: require('../../assets/art/base.hair.curly.brown/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.curly.auburn': {
    idle: { src: require('../../assets/art/base.hair.curly.auburn/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.curly.blonde': {
    idle: { src: require('../../assets/art/base.hair.curly.blonde/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.curly.silver': {
    idle: { src: require('../../assets/art/base.hair.curly.silver/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.curly.teal': {
    idle: { src: require('../../assets/art/base.hair.curly.teal/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.bun.black': {
    idle: { src: require('../../assets/art/base.hair.bun.black/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.bun.brown': {
    idle: { src: require('../../assets/art/base.hair.bun.brown/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.bun.auburn': {
    idle: { src: require('../../assets/art/base.hair.bun.auburn/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.bun.blonde': {
    idle: { src: require('../../assets/art/base.hair.bun.blonde/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.bun.silver': {
    idle: { src: require('../../assets/art/base.hair.bun.silver/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair.bun.teal': {
    idle: { src: require('../../assets/art/base.hair.bun.teal/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.dark.plain': {
    idle: { src: require('../../assets/art/base.face.dark.plain/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.dark.lashes': {
    idle: { src: require('../../assets/art/base.face.dark.lashes/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.brown.plain': {
    idle: { src: require('../../assets/art/base.face.brown.plain/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.brown.lashes': {
    idle: { src: require('../../assets/art/base.face.brown.lashes/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.green.plain': {
    idle: { src: require('../../assets/art/base.face.green.plain/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.green.lashes': {
    idle: { src: require('../../assets/art/base.face.green.lashes/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.blue.plain': {
    idle: { src: require('../../assets/art/base.face.blue.plain/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.blue.lashes': {
    idle: { src: require('../../assets/art/base.face.blue.lashes/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.violet.plain': {
    idle: { src: require('../../assets/art/base.face.violet.plain/idle.png'), frames: 1, fps: 1 },
  },
  'base.face.violet.lashes': {
    idle: { src: require('../../assets/art/base.face.violet.lashes/idle.png'), frames: 1, fps: 1 },
  },
  'gear.wooden-sword': {
    idle: { src: require('../../assets/art/gear.wooden-sword/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.wooden-sword/fight.png'), frames: 4, fps: 8 },
  },
  'gear.iron-sword': {
    idle: { src: require('../../assets/art/gear.iron-sword/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.iron-sword/fight.png'), frames: 4, fps: 8 },
  },
  'gear.emberforged-blade': {
    idle: { src: require('../../assets/art/gear.emberforged-blade/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.emberforged-blade/fight.png'), frames: 4, fps: 8 },
  },
  'gear.hunting-bow': {
    idle: { src: require('../../assets/art/gear.hunting-bow/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.hunting-bow/fight.png'), frames: 4, fps: 8 },
  },
  'gear.oakheart-bow': {
    idle: { src: require('../../assets/art/gear.oakheart-bow/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.oakheart-bow/fight.png'), frames: 4, fps: 8 },
  },
  'gear.yew-longbow': {
    idle: { src: require('../../assets/art/gear.yew-longbow/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.yew-longbow/fight.png'), frames: 4, fps: 8 },
  },
  'gear.apprentice-staff': {
    idle: { src: require('../../assets/art/gear.apprentice-staff/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.apprentice-staff/fight.png'), frames: 4, fps: 8 },
  },
  'gear.runed-staff': {
    idle: { src: require('../../assets/art/gear.runed-staff/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.runed-staff/fight.png'), frames: 4, fps: 8 },
  },
  'gear.moonlit-staff': {
    idle: { src: require('../../assets/art/gear.moonlit-staff/idle.png'), frames: 1, fps: 1 },
    fight: { src: require('../../assets/art/gear.moonlit-staff/fight.png'), frames: 4, fps: 8 },
  },
  'fx.aura.rare': {
    idle: { src: require('../../assets/art/fx.aura.rare/idle.png'), frames: 1, fps: 1 },
  },
  'fx.aura.epic': {
    idle: { src: require('../../assets/art/fx.aura.epic/idle.png'), frames: 1, fps: 1 },
  },
  'fx.aura.legendary': {
    idle: { src: require('../../assets/art/fx.aura.legendary/idle.png'), frames: 1, fps: 1 },
  },
};
