// Values from docs/design/style-guide.md §3–§6.
const light = {
  bg: '#F3EDE2',
  surface: '#FFFBF4',
  surfaceSunk: '#E8E0D1',
  text: '#2A2623',
  textMuted: '#6B6259',
  line: '#DDD3C2',
  primary: '#3F6B4F',
  onPrimary: '#FFFFFF',
  primaryLip: '#2C4D38',
  accent: '#C9892B',
  onAccent: '#2A2623',
  accentLip: '#9A6820',
  ember: '#B5543A',
  onEmber: '#FFFFFF',
  info: '#4D6A8A',
};

export type ColorTokens = typeof light;

const dark: ColorTokens = {
  bg: '#16191D',
  surface: '#22272D',
  surfaceSunk: '#1B1F24',
  text: '#EEE8DD',
  textMuted: '#A39B8F',
  line: '#343A42',
  primary: '#7FB08E',
  onPrimary: '#0F1A13',
  primaryLip: '#5C8A6B',
  accent: '#E3B25A',
  onAccent: '#1B1F24',
  accentLip: '#B88A3A',
  ember: '#E08467',
  onEmber: '#1B1F24',
  info: '#8FAACB',
};

export const colors = { light, dark };

export const scene = {
  skyTop: '#E9B98A',
  skyMid: '#8E7A9E',
  skyBottom: '#3E4A63',
  hillsFar: '#4F6A5A',
  ground: '#3B5546',
  lamp: '#F6D18B',
  wall: '#5B4A43',
  wallShade: '#4A3C37',
  floor: '#7A5E4C',
  window: '#8E7A9E',
};

/** Chips drawn over the scene; same in both modes because the scene is. */
export const hud = { bg: 'rgba(28,24,22,0.6)', text: '#FFF8EC' };

/** The Home page sits on a deep warm dusk (like Finch tints the page with its scene). Same in both modes. */
export const home = {
  bg: '#4A3B3A',
  text: '#FFF8EC',
  muted: '#E8DCCB',
  line: 'rgba(255,248,236,0.25)',
  dash: 'rgba(255,248,236,0.35)',
  /** Gauge fills and accents on the dark Home panel (fixed, so cream text stays readable in both modes). */
  fill: { moss: '#3F6B4F', gold: '#8A5C1A', slate: '#4D6A8A', ember: '#9E4630' },
  bossText: '#F2A48E',
};

/** The adventure quest board: a physical cork board with paper notes, same in both modes. */
export const board = { cork: '#A97C50', corkEdge: '#7E5A38', paper: '#FFF6E3', paperSelected: '#FFFDF6', ink: '#2A2623', inkMuted: '#5E554D', pin: '#B5543A' };

export const rarity = {
  common: '#8C877F',
  uncommon: '#5E9A6B',
  rare: '#4F7FB5',
  epic: '#8A5FB0',
  legendary: '#D49A2A',
};

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40, screen: 20 };
export const radius = { card: 20, sheet: 28, button: 16, chip: 999 };
export const minTouch = 44;
export const lipHeight = 4;

export const fonts = {
  heading: 'NunitoSans_800ExtraBold',
  body: 'NunitoSans_400Regular',
  bodySemi: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
};

export const type = {
  display: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 36 },
  title: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18, letterSpacing: 0.2 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
} as const;

export type TypeStyle = keyof typeof type;
