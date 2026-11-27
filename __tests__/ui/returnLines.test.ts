import { pickLine } from '@/src/ui/home/ReturnReveal';

test('different returns get different lines over time', () => {
  const lines = ['a', 'b', 'c'];
  const picked = new Set(Array.from({ length: 30 }, (_, i) => pickLine(new Date(2026, 0, 1, 0, i).toISOString(), lines)));
  expect(picked.size).toBeGreaterThan(1);
});
