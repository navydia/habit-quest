import { TITLES, earnedTitles } from '@/src/content/titles';
import { clockNow, setClockOffset } from '@/src/game/clock';
import { debugAction } from '@/src/game/debug';
import { goHome, travel } from '@/src/game/world';
import { migrate, newSave } from '@/src/save/migrate';
import { at } from '../helpers/save';

test('a new save has a profile, starts at home and has no clock offset', () => {
  const s = newSave();
  expect(s.version).toBe(6);
  expect(s.profile).toMatchObject({ name: 'Adventurer', titleId: 'wanderer', pronouns: 'they', background: 'home' });
  expect(s.profile.look).toEqual({ skin: 'tan', hairStyle: 'short', hairColor: 'brown', eyes: 'dark', ears: 'round' });
  expect(s.world.atHome).toBe(true);
  expect(s.dev).toEqual({ offsetMs: 0 });
});

test('a v5 save upgrades with profile defaults', () => {
  const v5: any = { ...newSave(), version: 5 };
  delete v5.profile;
  delete v5.dev;
  delete v5.world.atHome;
  const { save, recovered } = migrate(v5);
  expect(recovered).toBe(false);
  expect(save.version).toBe(6);
  expect(save.profile.name).toBe('Adventurer');
  expect(save.world.atHome).toBe(true);
});

test('titles unlock from what you have done', () => {
  const s = newSave();
  expect(earnedTitles(s).map((t) => t.id)).toEqual(['wanderer']);
  const offer = { id: 'o', templateId: 'slime-patrol', name: 'n', flavour: 'f', difficulty: 'easy' as const, requiredPower: 90, rewardExp: 40, rewardGold: 20 };
  s.questLog = [{ offer, success: true, exp: 1, gold: 1, resolvedAt: 'x' }];
  expect(earnedTitles(s).map((t) => t.id)).toContain('slime-wrangler');
  expect(TITLES.length).toBeGreaterThanOrEqual(9);
});

test('travelling leaves home; going home returns; adventures still come from the region', () => {
  const s = newSave();
  s.world.regions = { 'thornwick-meadows': { cleared: ['slime-patrol', 'herb-gathering', 'missing-goat'], mementos: [], bossDefeated: false } };
  s.player = { ...s.player, level: 4 };
  const away = travel(s, 'willowmere-marsh', at('2026-11-27', 9));
  expect(away.world.atHome).toBe(false);
  const back = goHome(away);
  expect(back.world.atHome).toBe(true);
  expect(back.world.currentRegion).toBe('willowmere-marsh');
});

test('the dev clock can skip hours and jump to a new day', () => {
  setClockOffset(0);
  const s0 = newSave();
  const base = at('2026-11-27', 22);
  const s1 = debugAction(s0, 'skip3', base);
  expect(s1.dev.offsetMs).toBe(3 * 3600_000);
  const s2 = debugAction(s0, 'newDay', base);
  expect(new Date(base.getTime() + s2.dev.offsetMs).getHours()).toBe(0);
  setClockOffset(5000);
  expect(Math.abs(clockNow().getTime() - Date.now() - 5000)).toBeLessThan(50);
  setClockOffset(0);
});
