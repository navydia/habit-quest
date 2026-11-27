import { gearById } from '@/src/content/gear';
import { availableBosses, bossChance, bossTokens, setBossHabit } from '@/src/game/bosses';
import { collectResult, resolveQuest, startQuest } from '@/src/game/questRun';
import { generateBoard } from '@/src/game/quests';
import { seededRng } from '@/src/game/rng';
import type { SaveData } from '@/src/game/types';
import { newSave } from '@/src/save/migrate';
import { at, habit } from '../helpers/save';

const DAY = '2026-11-27';
const BOSS = 'old-bramblehide';

/** Boss habit 'b' chosen on Nov 20, then completed `n` times on the days after. */
function withTokens(n: number): SaveData {
  let s = newSave();
  s.habits = [habit('a'), habit('b', { kind: 'weekdays', days: [] })]; // b isn't scheduled, so only 'a' counts for the gauge
  s = setBossHabit(s, 'b', at('2026-11-20', 7));
  const days = ['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27'];
  s.completions = days.slice(0, n).map((d) => ({ habitId: 'b', dayKey: d, at: at(d, 8).toISOString() }));
  s.completions.push({ habitId: 'a', dayKey: DAY, at: at(DAY, 8).toISOString() });
  s.board = { dayKey: DAY, offers: generateBoard(DAY, s.player, seededRng(DAY)) };
  return s;
}

test('tokens count boss-habit completions after the epoch, capped at 6', () => {
  expect(bossTokens(withTokens(3))).toBe(3);
  expect(bossTokens(withTokens(7))).toBe(6);
  const s = withTokens(3);
  expect(bossTokens({ ...s, completions: s.completions.slice(1) })).toBe(2); // unchecking removes a token
});

test('switching the boss habit resets tokens', () => {
  const s = setBossHabit(withTokens(5), 'a', at(DAY, 9));
  expect(bossTokens(s)).toBe(0);
});

test('only bosses of unlocked regions are available', () => {
  expect(availableBosses(newSave()).map((b) => b.id)).toEqual([BOSS]);
});

test('harder difficulty means lower odds; Defense helps', () => {
  const p = withTokens(6).player; // 103 power vs 140
  const boss = availableBosses(newSave())[0];
  expect(bossChance(p, boss, 'normal')).toBe(0.6);
  expect(bossChance(p, boss, 'extreme')).toBe(0.2);
  const tanky = { ...p, stats: { ...p.stats, defense: 20 } }; // +40 effective
  expect(bossChance(tanky, boss, 'normal')).toBe(1);
});

test('starting with a boss needs 6 tokens and spends them', () => {
  expect(() => startQuest(withTokens(5), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' })).toThrow();
  const s = startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
  expect(s.activeRun?.boss?.bossId).toBe(BOSS);
  expect(bossTokens(s)).toBe(0);
});

test('unchecking an old boss-habit completion after the fight started keeps tokens spent', () => {
  const s = startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
  const fewer = { ...s, completions: s.completions.slice(1) };
  expect(bossTokens(fewer)).toBe(0);
  expect(fewer.activeRun?.boss).toEqual(s.activeRun?.boss);
});

test('winning beats the boss, pays out and drops non-common gear', () => {
  const s = startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
  const r = resolveQuest(s, at(DAY, 18), () => 0).pendingResult!;
  expect(r.boss).toMatchObject({ bossId: BOSS, success: true, exp: 150, gold: 80 });
  expect(gearById(r.boss!.drop!.gearId)!.rarity).not.toBe('common');
  expect(resolveQuest(s, at(DAY, 18), () => 0).world.regions['thornwick-meadows'].bossDefeated).toBe(true);
});

test('losing keeps the 6 tokens for another try', () => {
  const s = startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
  let n = 0;
  const rng = () => (n++ === 0 ? 0 : 0.99); // adventure succeeds, everything else fails
  const r = resolveQuest(s, at(DAY, 18), rng);
  expect(r.pendingResult?.boss?.success).toBe(false);
  expect(bossTokens(r)).toBe(6);
});

test('Hard pays 1.75× and Extreme 3×', () => {
  const run = (d: 'hard' | 'extreme') => resolveQuest(startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: d }), at(DAY, 18), () => 0).pendingResult!.boss!;
  expect(run('hard').exp).toBe(Math.round(150 * 1.75));
  expect(run('extreme').gold).toBe(240);
});

test('a familiar can drop, is never given twice, and its bonus applies when collecting', () => {
  const s = startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
  const won = resolveQuest(s, at(DAY, 18), () => 0);
  expect(won.pendingResult?.boss?.familiarId).toBe('hoglet');
  const { save } = collectResult(won);
  expect(save.familiars.owned).toEqual(['hoglet']);
  const owned = startQuest({ ...withTokens(6), familiars: { owned: ['hoglet'], active: 'hoglet' } }, `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
  const again = resolveQuest(owned, at(DAY, 18), () => 0);
  expect(again.pendingResult?.boss?.familiarId).toBeUndefined();
  const before = again.player.gold;
  const gained = collectResult(again).save.player.gold - before;
  const base = again.pendingResult!.gold + again.pendingResult!.boss!.gold;
  expect(gained).toBe(Math.round(base * 1.03)); // Hoglet: +3% gold
});

test('Skip resolves the boss as well', () => {
  const s = startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
  expect(resolveQuest(s, at(DAY, 9, 1), () => 0, true).pendingResult?.boss).toBeDefined();
});

describe('review fixes', () => {
  const start = () => startQuest(withTokens(6), `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });

  test('unchecking and re-checking a spent boss-habit day does not make a token again', () => {
    const s = start();
    const spent = s.completions.find((c) => c.habitId === 'b')!;
    const rechecked = { ...s, completions: [...s.completions.filter((c) => c !== spent), { ...spent, at: at(DAY, 9, 1).toISOString() }] };
    expect(bossTokens(rechecked)).toBe(0);
  });

  test('a loss gives back all 6 tokens even if one was unchecked during the trip', () => {
    const s = start();
    const fewer = { ...s, completions: s.completions.filter((c) => c.dayKey !== '2026-11-21') };
    let n = 0;
    const r = resolveQuest(fewer, at(DAY, 18), () => (n++ === 0 ? 0 : 0.99));
    expect(r.pendingResult?.boss?.tokensKept).toBe(true);
    expect(bossTokens(r)).toBe(6);
  });

  test('if the boss habit was switched during the trip, a loss says the tokens were not kept', () => {
    const s = setBossHabit(start(), 'a', at(DAY, 10));
    let n = 0;
    const r = resolveQuest(s, at(DAY, 18), () => (n++ === 0 ? 0 : 0.99));
    expect(r.pendingResult?.boss?.tokensKept).toBe(false);
  });

  test('Luck raises the familiar chance', () => {
    const lucky = withTokens(6);
    lucky.player = { ...lucky.player, stats: { ...lucky.player.stats, luck: 20 } }; // +10 percentage points
    const s = startQuest(lucky, `${DAY}-easy`, at(DAY, 9), { bossId: BOSS, difficulty: 'normal' });
    let n = 0;
    // adventure win, adventure drop miss, boss win, rarity, item, familiar roll 0.15 (base 0.1 would miss)
    const seq = [0, 0.99, 0, 0, 0, 0.15];
    const r = resolveQuest(s, at(DAY, 18), () => seq[n++] ?? 0.99);
    expect(r.pendingResult?.boss?.familiarId).toBe('hoglet');
  });
});
