import { RUG, rugUnderFeet } from '@/src/ui/home/HomeScene';

test("the rug's centre sits on the hero's feet", () => {
  // A 210-tall sprite has its feet 20/320 of the way up; the hero's centre is at x 125.
  const s = rugUnderFeet(210, 125);
  expect(s.left + RUG.w / 2).toBe(125);
  expect(s.bottom + RUG.h / 2).toBeCloseTo(210 * (20 / 320));
});
