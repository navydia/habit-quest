import { REGIONS, regionById, type RegionDef } from '../content/regions';
import { powerOf } from './stats';
import type { QuestOffer, RegionProgress, SaveData } from './types';

export type TravelCheck = { ok: true } | { ok: false; reason: string };

export const emptyProgress = (): RegionProgress => ({ cleared: [], mementos: [], bossDefeated: false });

export function currentRegion(s: SaveData): RegionDef {
  return regionById(s.world.currentRegion) ?? REGIONS[0];
}

export function progressOf(s: SaveData, regionId: string): RegionProgress {
  return s.world.regions[regionId] ?? emptyProgress();
}

export function isRegionCleared(s: SaveData, regionId: string): boolean {
  const r = regionById(regionId);
  return !!r && r.adventures.every((a) => progressOf(s, regionId).cleared.includes(a.id));
}

export function isRegionComplete(s: SaveData, regionId: string): boolean {
  return isRegionCleared(s, regionId) && progressOf(s, regionId).bossDefeated;
}

function isAvailableNow(r: RegionDef, now: Date): boolean {
  const t = now.toISOString();
  return (!r.availableFrom || t >= r.availableFrom) && (!r.availableUntil || t <= r.availableUntil);
}

/** Why a region is still locked, or null if it's open. Visited regions stay open. */
export function lockReason(s: SaveData, regionId: string): string | null {
  const i = REGIONS.findIndex((r) => r.id === regionId);
  if (i < 0) return 'That region is not on the map.';
  if (i === 0 || s.world.regions[regionId] || s.world.currentRegion === regionId) return null;
  const prev = REGIONS[i - 1];
  if (!isRegionCleared(s, prev.id)) return `Clear every adventure in ${prev.name} first.`;
  const power = powerOf(s.player);
  if (power < REGIONS[i].minPower) return `Needs ${REGIONS[i].minPower} power. You have ${power}.`;
  return null;
}

export function isRegionUnlocked(s: SaveData, regionId: string): boolean {
  return lockReason(s, regionId) === null;
}

export function canTravel(s: SaveData, regionId: string, now: Date): TravelCheck {
  if (s.activeRun) return { ok: false, reason: 'Your hero is out on an adventure. Travel once they are home.' };
  const r = regionById(regionId);
  if (!r || !isAvailableNow(r, now)) return { ok: false, reason: 'That region is not on the map.' };
  if (currentRegion(s).id === regionId && s.world.atHome === false) return { ok: false, reason: 'You are already here.' };
  const reason = lockReason(s, regionId);
  return reason ? { ok: false, reason } : { ok: true };
}

export function travel(s: SaveData, regionId: string, now: Date): SaveData {
  if (!canTravel(s, regionId, now).ok) return s;
  return {
    ...s,
    board: currentRegion(s).id === regionId ? s.board : null,
    world: { currentRegion: regionId, regions: { ...s.world.regions, [regionId]: progressOf(s, regionId) }, atHome: false },
  };
}

/** Records a successful adventure. Returns the memento if this was the first clear. */
export function recordClear(s: SaveData, offer: QuestOffer): { save: SaveData; memento?: { regionId: string; mementoId: string } } {
  const region = regionById(offer.regionId ?? '') ?? currentRegion(s);
  const adventure = region.adventures.find((a) => a.id === offer.templateId);
  if (!adventure) return { save: s };
  const prog = progressOf(s, region.id);
  if (prog.cleared.includes(adventure.id)) return { save: s };
  const next: RegionProgress = { ...prog, cleared: [...prog.cleared, adventure.id], mementos: [...prog.mementos, adventure.memento.id] };
  return {
    save: { ...s, world: { ...s.world, regions: { ...s.world.regions, [region.id]: next } } },
    memento: { regionId: region.id, mementoId: adventure.memento.id },
  };
}

/** Back to the cottage. Adventures still come from the last region you travelled to. */
export function goHome(s: SaveData): SaveData {
  return s.world.atHome ? s : { ...s, world: { ...s.world, atHome: true } };
}

/** 'home' or the current region id: which scene to show. */
export function placeId(s: SaveData): string {
  return s.world.atHome === false ? currentRegion(s).id : 'home';
}
