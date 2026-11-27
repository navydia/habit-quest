import { contrastRatio } from '@/src/theme/contrast';
import { colors } from '@/src/theme/tokens';

test('contrastRatio matches known values', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
});

describe.each(['light', 'dark'] as const)('%s mode text meets 4.5:1', (mode) => {
  const c = colors[mode];
  test.each([
    ['text', 'bg'],
    ['text', 'surface'],
    ['textMuted', 'surface'],
    ['textMuted', 'bg'],
    ['onPrimary', 'primary'],
    ['onAccent', 'accent'],
  ] as const)('%s on %s', (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
