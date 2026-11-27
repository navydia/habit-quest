// Generates placeholder sprite strips in the real art format (see docs/art/art-spec.md).
//   node scripts/gen-placeholders.mjs             → writes only PNGs that don't exist yet
//   node scripts/gen-placeholders.mjs --force     → rewrites every placeholder PNG (overwrites your art!)
//   node scripts/gen-placeholders.mjs --manifest  → also rewrites src/art/manifest.ts
// Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.
// You do NOT need this script to use your own art; just replace the PNGs.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FW = 256, FH = 320; // frame size
const FORCE = process.argv.includes('--force');
const MANIFEST = process.argv.includes('--manifest') || !fs.existsSync(path.join(ROOT, 'src/art/manifest.ts'));

// All drawing uses a 120×160 hero space, placed so the feet sit at (128, 300).
const place = (inner) => `<g transform="translate(32,63) scale(1.6)">${inner}</g>`;
const C = { skin: '#E8C4A0', skinShade: '#D6AD86', hair: '#5A3E32', eye: '#2A2623', blush: '#E0937A', trousers: '#4A4A58', shoe: '#3F3530', shirt: '#B8A58C', shirtShade: '#A69277' };

const torso = (fill, shade, extra = '') => `
  <rect x="29" y="84" width="12" height="34" rx="6" fill="${shade}"/><circle cx="35" cy="120" r="6" fill="${C.skin}"/>
  <rect x="79" y="84" width="12" height="34" rx="6" fill="${shade}"/><circle cx="85" cy="120" r="6" fill="${C.skin}"/>
  <rect x="39" y="78" width="42" height="50" rx="16" fill="${fill}"/>${extra}`;
const belt = (buckle = '#C9892B') => `<rect x="39" y="110" width="42" height="6" fill="#5B4A43"/><rect x="56" y="109" width="8" height="8" rx="2" fill="${buckle}"/>`;
const boots = (fill, extra = '') => `<rect x="44" y="136" width="16" height="12" rx="5" fill="${fill}"/><rect x="60" y="136" width="16" height="12" rx="5" fill="${fill}"/>${extra}`;

// Weapons are drawn pointing up from the hand at (85,120), then rotated for the fight frames.
const sword = (blade, guard, grip = '#5B4A43') => `<path d="M82 66 Q85 60 88 66 L88 112 L82 112 Z" fill="${blade}"/><rect x="77" y="111" width="16" height="4" rx="2" fill="${guard}"/><rect x="83" y="114" width="4" height="10" rx="1.5" fill="${grip}"/>`;
const bow = (wood, string = '#EDE6D6') => `<path d="M88 72 Q104 100 88 128" stroke="${wood}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M88 72 L88 128" stroke="${string}" stroke-width="1.2"/>`;
const staff = (wood, orb) => `<rect x="83" y="62" width="4" height="66" rx="2" fill="${wood}"/><circle cx="85" cy="60" r="6" fill="${orb}"/><circle cx="83" cy="58" r="2" fill="#fff" opacity="0.6"/>`;
const held = (weapon, angle) => `<g transform="rotate(${angle} 85 120)">${weapon}</g>`;
const FIGHT_ANGLES = [-40, -10, 25, 55];

const ITEMS = {
  // base
  'base.legs': () => `<rect x="47" y="120" width="11" height="24" rx="5" fill="${C.trousers}"/><rect x="62" y="120" width="11" height="24" rx="5" fill="${C.trousers}"/>${boots(C.shoe)}`,
  'base.body': () => torso(C.shirt, C.shirtShade),
  'base.head': () => `<circle cx="33" cy="54" r="5" fill="${C.skinShade}"/><circle cx="87" cy="54" r="5" fill="${C.skinShade}"/><circle cx="60" cy="50" r="28" fill="${C.skin}"/>`,
  'base.face': () => `<circle cx="50" cy="55" r="3.8" fill="${C.eye}"/><circle cx="70" cy="55" r="3.8" fill="${C.eye}"/><circle cx="51.3" cy="53.7" r="1.3" fill="#fff"/><circle cx="71.3" cy="53.7" r="1.3" fill="#fff"/><ellipse cx="43" cy="63" rx="4.5" ry="2.4" fill="${C.blush}" opacity="0.55"/><ellipse cx="77" cy="63" rx="4.5" ry="2.4" fill="${C.blush}" opacity="0.55"/><path d="M56 65 Q60 68 64 65" stroke="${C.eye}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  'base.hair': () => `<path d="M31 50 Q30 20 60 20 Q90 20 89 50 Q84 36 70 34 Q64 42 50 38 Q40 42 31 50 Z" fill="${C.hair}"/>`,
  // body
  'gear.travellers-tunic': () => torso('#6E8B74', '#5C7862', belt()),
  'gear.padded-jerkin': () => torso('#8C6A4F', '#7A5C44', `<path d="M48 82 L48 108 M60 80 L60 108 M72 82 L72 108" stroke="#6F543E" stroke-width="2"/>${belt()}`),
  'gear.chainmail': () => torso('#9AA3A8', '#868F94', `<g fill="#7E878C">${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<circle cx="${45 + c * 7.5}" cy="${86 + r * 6}" r="1.4"/>`).join('')).join('')}</g>${belt('#D7DCE0')}`),
  'gear.wardens-plate': () => torso('#5E6E86', '#4E5C72', `<rect x="27" y="80" width="16" height="10" rx="5" fill="#7A8AA3"/><rect x="77" y="80" width="16" height="10" rx="5" fill="#7A8AA3"/><path d="M60 82 L60 106" stroke="#D49A2A" stroke-width="2"/>${belt('#D49A2A')}`),
  // head
  'gear.leather-cap': () => `<path d="M31 48 Q30 18 60 18 Q90 18 89 48 Q60 38 31 48 Z" fill="#8C6A4F"/><rect x="30" y="44" width="60" height="6" rx="3" fill="#6F543E"/>`,
  'gear.ranger-hood': () => `<path d="M26 62 Q22 14 60 14 Q98 14 94 62 Q90 40 80 34 Q60 28 40 34 Q30 40 26 62 Z" fill="#4F6A5A"/><path d="M60 14 L66 4 L70 16 Z" fill="#4F6A5A"/>`,
  'gear.iron-helm': () => `<path d="M30 50 Q30 16 60 16 Q90 16 90 50 L84 50 Q80 34 60 32 Q40 34 36 50 Z" fill="#9AA3A8"/><rect x="58" y="32" width="4" height="22" rx="2" fill="#868F94"/><path d="M60 16 L60 8" stroke="#B5543A" stroke-width="4" stroke-linecap="round"/>`,
  'gear.circlet-of-stars': () => `<path d="M32 40 Q60 30 88 40" stroke="#D49A2A" stroke-width="4" fill="none"/><path d="M60 26 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 z" fill="#F6D18B"/>`,
  // feet
  'gear.worn-boots': () => boots('#5B4A43'),
  'gear.soft-boots': () => boots('#7A5E4C', `<rect x="44" y="136" width="16" height="3" rx="1.5" fill="#B8A58C"/><rect x="60" y="136" width="16" height="3" rx="1.5" fill="#B8A58C"/>`),
  'gear.windstep-boots': () => boots('#4F7FB5', `<path d="M44 140 l-8 -4 l2 6 z M76 140 l8 -4 l-2 6 z" fill="#DDE7F2"/>`),
  // accessory (drawn behind the body; charms float by the shoulder)
  'gear.lucky-pebble': () => `<circle cx="100" cy="76" r="5" fill="#8C877F"/><circle cx="98" cy="74" r="1.5" fill="#fff" opacity="0.6"/>`,
  'gear.travel-cloak': () => `<path d="M36 80 Q60 72 84 80 L94 146 Q60 152 26 146 Z" fill="#33505A"/><path d="M38 80 Q34 110 30 140 L38 141 Q40 112 44 82 Z M82 80 Q86 110 90 140 L82 141 Q80 112 76 82 Z" fill="#3E5F66"/>`,
  'gear.fox-charm': () => `<path d="M96 70 l4 -6 l4 6 l3 -5 l1 8 q-4 8 -8 8 q-4 0 -8 -8 l1 -8 z" fill="#C9892B"/><circle cx="98" cy="74" r="1" fill="#2A2623"/><circle cx="102" cy="74" r="1" fill="#2A2623"/>`,
  'gear.dragonscale-cloak': () => `<path d="M34 80 Q60 70 86 80 L98 148 Q60 156 22 148 Z" fill="#6B2F2A"/><path d="M30 120 q8 6 16 0 q8 6 16 0 q8 6 16 0 q8 6 16 0" stroke="#B5543A" stroke-width="2" fill="none"/>`,
};
const WEAPONS = {
  'gear.wooden-sword': sword('#B08A5E', '#7A5E4C'),
  'gear.iron-sword': sword('#D7DCE0', '#8C6A3F'),
  'gear.emberforged-blade': sword('#F0A06A', '#D49A2A', '#6B2F2A'),
  'gear.hunting-bow': bow('#8C6A4F'),
  'gear.oakheart-bow': bow('#5E7D3A'),
  'gear.yew-longbow': bow('#6B4A30', '#F6D18B'),
  'gear.apprentice-staff': staff('#8C6A4F', '#8C877F'),
  'gear.runed-staff': staff('#6B4A30', '#5E9A6B'),
  'gear.moonlit-staff': staff('#4A4A58', '#B9A8E0'),
};
const AURAS = { rare: '#4F7FB5', epic: '#8A5FB0', legendary: '#D49A2A' };

const assets = []; // { id, anim, frames, fps, draw(frameIndex) }
for (const [id, draw] of Object.entries(ITEMS)) assets.push({ id, anim: 'idle', frames: 1, fps: 1, draw: () => draw() });
for (const [id, w] of Object.entries(WEAPONS)) {
  assets.push({ id, anim: 'idle', frames: 1, fps: 1, draw: () => held(w, 12) });
  assets.push({ id, anim: 'fight', frames: FIGHT_ANGLES.length, fps: 8, draw: (f) => held(w, FIGHT_ANGLES[f]) });
}
for (const [r, color] of Object.entries(AURAS)) {
  assets.push({
    id: `fx.aura.${r}`, anim: 'idle', frames: 1, fps: 1,
    draw: () => `<defs><radialGradient id="g"><stop offset="0" stop-color="${color}" stop-opacity="0.55"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><ellipse cx="60" cy="96" rx="58" ry="70" fill="url(#g)"/>`,
  });
}

const svgStrip = (a) => {
  const frames = Array.from({ length: a.frames }, (_, f) => `<g transform="translate(${f * FW},0)">${place(a.draw(f))}</g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${FW * a.frames}" height="${FH}" viewBox="0 0 ${FW * a.frames} ${FH}">${frames}</svg>`;
};

const browser = await chromium.launch();
const page = await browser.newPage();
let written = 0;
for (const a of assets) {
  const out = path.join(ROOT, 'assets/art', a.id, `${a.anim}.png`);
  if (fs.existsSync(out) && !FORCE) continue;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.setViewportSize({ width: FW * a.frames, height: FH });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svgStrip(a)}</body></html>`);
  await page.locator('svg').screenshot({ path: out, omitBackground: true });
  written++;
}
await browser.close();
console.log(`placeholders written: ${written} (of ${assets.length})`);

if (MANIFEST) {
  const byId = {};
  for (const a of assets) (byId[a.id] ??= []).push(a);
  const lines = Object.entries(byId).map(([id, list]) =>
    `  '${id}': {\n${list.map((a) => `    ${a.anim}: { src: require('../../assets/art/${id}/${a.anim}.png'), frames: ${a.frames}, fps: ${a.fps} },`).join('\n')}\n  },`);
  fs.writeFileSync(path.join(ROOT, 'src/art/manifest.ts'), `// Art manifest: one entry per art id. See docs/art/art-spec.md.\n// To use your own art, replace the PNG. If its frame count changes, update \`frames\` here.\nimport type { ArtAsset, Anim } from './types';\n\nexport const ART: Record<string, Partial<Record<Anim, ArtAsset>>> = {\n${lines.join('\n')}\n};\n`);
  console.log('manifest written');
}
