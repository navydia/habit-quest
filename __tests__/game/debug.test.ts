import { bossTokens, setBossHabit } from '@/src/game/bosses';
import { debugAction } from '@/src/game/debug';
import { gaugeProgress } from '@/src/game/gauge';
import { REGIONS } from '@/src/content/regions';
import { GEAR } from '@/src/content/gear';
import { isRegionUnlocked } from '@/src/game/world';
import { newSave } from '@/src/save/migrate';
import { at, habit } from '../helpers/save';

const DAY = '2026-11-27';
const now = at(DAY, 10);

test('fill gauge completes all of today\'s habits', () => {
  const s = { ...newSave(), habits: [habit('a'), habit('b')] };
  expect(gaugeProgress(debugAction(s, 'fillGauge', now), DAY).full).toBe(true);
});

test('boss tokens: grants 6 (choosing the first habit if none is set)', () => {
  const s = { ...newSave(), habits: [habit('a')] };
  expect(bossTokens(debugAction(s, 'bossTokens', now))).toBe(6);
  expect(bossTokens(debugAction(setBossHabit(s, 'a', at(DAY, 9)), 'bossTokens', now))).toBe(6);
});

test('level up, gold, new day, all gear, familiars and regions', () => {
  const s = newSave();
  expect(debugAction(s, 'levelUp', now).player.level).toBe(2);
  expect(debugAction(s, 'gold', now).player.gold).toBe(500);
  expect(debugAction({ ...s, lastQuestStartedDayKey: DAY }, 'anotherAdventure', now).lastQuestStartedDayKey).toBeNull();
  expect(debugAction(s, 'allGear', now).player.inventory.length).toBe(s.player.inventory.length + GEAR.length);
  expect(debugAction(s, 'allFamiliars', now).familiars.owned).toHaveLength(REGIONS.length);
  const open = debugAction(s, 'unlockRegions', now);
  expect(REGIONS.every((r) => isRegionUnlocked(open, r.id))).toBe(true);
});

test('reset returns a fresh save', () => {
  expect(debugAction({ ...newSave(), habits: [habit('a')] }, 'reset', now)).toEqual(newSave());
});
