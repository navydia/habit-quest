// Art manifest: one entry per art id. See docs/art/art-spec.md.
// To use your own art, replace the PNG. If its frame count changes, update `frames` here.
import type { ArtAsset, Anim } from './types';

export const ART: Record<string, Partial<Record<Anim, ArtAsset>>> = {
  'base.legs': {
    idle: { src: require('../../assets/art/base.legs/idle.png'), frames: 1, fps: 1 },
  },
  'base.body': {
    idle: { src: require('../../assets/art/base.body/idle.png'), frames: 1, fps: 1 },
  },
  'base.head': {
    idle: { src: require('../../assets/art/base.head/idle.png'), frames: 1, fps: 1 },
  },
  'base.face': {
    idle: { src: require('../../assets/art/base.face/idle.png'), frames: 1, fps: 1 },
  },
  'base.hair': {
    idle: { src: require('../../assets/art/base.hair/idle.png'), frames: 1, fps: 1 },
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
