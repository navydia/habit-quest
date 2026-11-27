import { lifetimeStats } from '@/src/game/lifetime';
import { newSave } from '@/src/save/migrate';

test('lifetime stats come from the log, completions and world', () => {
  const s = newSave();
  const offer = { id: 'o', templateId: 'slime-patrol', name: 'n', flavour: 'f', difficulty: 'easy' as const, requiredPower: 90, rewardExp: 40, rewardGold: 20 };
  s.questLog = [
    { offer, success: true, exp: 40, gold: 20, resolvedAt: 'x' },
    { offer, success: false, exp: 10, gold: 5, resolvedAt: 'y' },
    { kind: 'boss', offer, success: true, exp: 0, gold: 0, resolvedAt: 'z', boss: { bossId: 'old-bramblehide', difficulty: 'normal', success: true, exp: 150, gold: 80 } },
  ];
  s.completions = [{ habitId: 'a', dayKey: '2026-11-27', at: 'x' }, { habitId: 'a', dayKey: '2026-11-26', at: 'y', hidden: true }];
  s.world.regions = { 'thornwick-meadows': { cleared: ['slime-patrol'], mementos: ['plum-jam-jar'], bossDefeated: true } };
  expect(lifetimeStats(s)).toEqual({ adventuresCompleted: 1, adventuresTried: 2, habitsCompleted: 2, bossesBeaten: 1, regionsExplored: 1, mementos: 1, goldEarned: 105 });
});
