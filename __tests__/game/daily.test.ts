import { claimDaily, ensureDaily, progressDaily } from '@/src/game/daily';
import { newSave } from '@/src/save/migrate';
import { at } from '../helpers/save';

const DAY = '2026-11-27';

test('three different quests a day, new ones the next day', () => {
  const s = ensureDaily(newSave(), at(DAY, 8));
  expect(s.daily.dayKey).toBe(DAY);
  expect(s.daily.quests).toHaveLength(3);
  expect(new Set(s.daily.quests.map((q) => q.kind)).size).toBe(3);
  expect(ensureDaily(s, at(DAY, 20))).toBe(s);
  const next = ensureDaily(s, at('2026-11-28', 8));
  expect(next.daily.dayKey).toBe('2026-11-28');
  expect(next.daily.quests.every((q) => q.progress === 0 && !q.claimed)).toBe(true);
});

test('progress counts today only, caps at the target, and pays once when claimed', () => {
  let s = ensureDaily(newSave(), at(DAY, 8));
  const q = s.daily.quests[0];
  for (let i = 0; i < q.target + 2; i++) s = progressDaily(s, q.kind, at(DAY, 9));
  expect(s.daily.quests[0].progress).toBe(q.target);
  const gold = s.player.gold;
  s = claimDaily(s, q.id);
  expect(s.player.gold).toBe(gold + q.reward);
  expect(claimDaily(s, q.id).player.gold).toBe(gold + q.reward);
});

test('progress from yesterday does not count toward today', () => {
  let s = ensureDaily(newSave(), at(DAY, 8));
  const kind = s.daily.quests[0].kind;
  s = progressDaily(s, kind, at('2026-11-28', 9)); // new day: quests reset first
  expect(s.daily.dayKey).toBe('2026-11-28');
});

test('an unfinished quest cannot be claimed', () => {
  const s = ensureDaily(newSave(), at(DAY, 8));
  expect(claimDaily(s, s.daily.quests[0].id)).toBe(s);
});
