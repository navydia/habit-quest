import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { placeOf, type PlacePalette } from '@/src/content/places';
import { scene } from '@/src/theme/tokens';

/** Full-bleed dusk backdrop. Placeholder art in the final style (style guide §3, §7). */
/** `place`: 'home' or a region id. Outdoors scenes take the region's palette. */
export function HomeScene({ place }: { place: string }) {
  const pal = placeOf(place);
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 420" preserveAspectRatio="xMidYMax slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.sky?.[0] ?? scene.skyBottom} />
          <Stop offset="0.55" stopColor={pal.sky?.[1] ?? scene.skyMid} />
          <Stop offset="1" stopColor={pal.sky?.[2] ?? scene.skyTop} />
        </LinearGradient>
        <RadialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={scene.lamp} stopOpacity="0.55" />
          <Stop offset="1" stopColor={scene.lamp} stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={pal.bottom} stopOpacity="0" />
          <Stop offset="1" stopColor={pal.bottom} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {pal.kind === 'home' ? <Cottage /> : <Outdoors pal={pal} />}
    </Svg>
  );
}

/**
 * Furniture placeholders, laid out from the creator's sketch (2026-11-28). Each piece is one entry in
 * COTTAGE_LAYOUT (viewBox units, 390 × 420; the floor starts at y 300) so it can be moved without touching the art.
 */
export const COTTAGE_LAYOUT = {
  lamp: { x: 210, y: 0, drop: 100 },
  shelf: { x: 34, y: 140, w: 92, h: 96 },
  window: { cx: 214, cy: 192, r: 50 },
  door: { x: 304, y: 168, w: 64, h: 136 },
  bed: { x: 14, y: 282, w: 120, h: 64 },
  table: { x: 124, y: 284, w: 40, h: 30 },
  statue: { x: 258, y: 262, w: 26, h: 62 },
} as const;

function Cottage() {
  const L = COTTAGE_LAYOUT;
  const { lamp, shelf, window: win, door, bed, table, statue } = L;
  const floor = placeOf('home').bottom;
  return (
    <G>
      <Rect width="390" height="420" fill={placeOf('home').top} />
      {[40, 110, 180, 250, 320].map((x) => (
        <Rect key={x} x={x} y="0" width="3" height="300" fill={scene.wallShade} opacity="0.5" />
      ))}
      {/* round window onto the dusk, behind the hero */}
      <Circle cx={win.cx} cy={win.cy} r={win.r + 8} fill={scene.wallShade} />
      <Circle cx={win.cx} cy={win.cy} r={win.r} fill="url(#sky)" />
      <Path
        d={`M${win.cx - win.r} ${win.cy + win.r * 0.45} Q${win.cx - 15} ${win.cy + 2} ${win.cx + 15} ${win.cy + win.r * 0.4} T${win.cx + win.r} ${win.cy + win.r * 0.3} L${win.cx + win.r} ${win.cy + win.r} L${win.cx - win.r} ${win.cy + win.r} Z`}
        fill={scene.hillsFar}
      />
      <Rect x={win.cx - 2} y={win.cy - win.r} width="4" height={win.r * 2} fill={scene.wallShade} />
      <Rect x={win.cx - win.r} y={win.cy - 2} width={win.r * 2} height="4" fill={scene.wallShade} />
      {/* shelf (bookcase placeholder) */}
      <Rect x={shelf.x} y={shelf.y} width={shelf.w} height={shelf.h} rx="4" fill={scene.wallShade} />
      {[0.33, 0.66].map((f) => (
        <Rect key={f} x={shelf.x + 4} y={shelf.y + shelf.h * f} width={shelf.w - 8} height="4" fill={scene.floor} />
      ))}
      <Rect x={shelf.x + 10} y={shelf.y + 8} width="12" height={shelf.h * 0.33 - 8} rx="2" fill="#7E8F6A" />
      <Rect x={shelf.x + 26} y={shelf.y + 14} width="10" height={shelf.h * 0.33 - 14} rx="2" fill="#A06A4F" />
      <Circle cx={shelf.x + shelf.w - 18} cy={shelf.y + shelf.h * 0.66 - 9} r="9" fill="#C79A5B" />
      {/* door */}
      <Rect x={door.x} y={door.y} width={door.w} height={door.h} rx="30" fill={scene.wallShade} />
      <Rect x={door.x + 6} y={door.y + 6} width={door.w - 12} height={door.h - 6} rx="26" fill="#6B4A3A" />
      <Circle cx={door.x + door.w - 16} cy={door.y + door.h * 0.58} r="4" fill="#D9B46A" />
      {/* hanging lamp */}
      <Rect x={lamp.x - 1} y={lamp.y} width="2" height={lamp.drop} fill={scene.wallShade} />
      <Circle cx={lamp.x} cy={lamp.y + lamp.drop + 16} r="70" fill="url(#lampGlow)" />
      <Path
        d={`M${lamp.x - 26} ${lamp.y + lamp.drop + 18} Q${lamp.x} ${lamp.y + lamp.drop - 8} ${lamp.x + 26} ${lamp.y + lamp.drop + 18} Z`}
        fill="#D9B46A"
      />
      {/* floor, fading into the page colour at the bottom */}
      <Rect x="0" y="300" width="390" height="120" fill={floor} />
      <Rect x="0" y="300" width="390" height="6" fill={scene.wallShade} opacity="0.6" />
      <Ellipse cx="195" cy="372" rx="130" ry="26" fill="#8C4F3F" opacity="0.85" />
      <Ellipse cx="195" cy="372" rx="108" ry="19" fill="none" stroke="#C9892B" strokeWidth="3" opacity="0.6" />
      {/* bed */}
      <Rect x={bed.x} y={bed.y + bed.h * 0.35} width={bed.w} height={bed.h * 0.65} rx="8" fill="#5C4034" />
      <Rect x={bed.x + 4} y={bed.y + bed.h * 0.2} width={bed.w - 8} height={bed.h * 0.4} rx="8" fill="#6F8FA6" />
      <Rect x={bed.x + 6} y={bed.y + bed.h * 0.1} width="30" height={bed.h * 0.3} rx="7" fill="#EFE3CF" />
      <Rect x={bed.x} y={bed.y} width="8" height={bed.h} rx="3" fill="#5C4034" />
      {/* side table */}
      <Rect x={table.x} y={table.y} width={table.w} height="6" rx="2" fill="#7A5240" />
      <Rect x={table.x + 4} y={table.y + 6} width="5" height={table.h - 6} fill="#5C4034" />
      <Rect x={table.x + table.w - 9} y={table.y + 6} width="5" height={table.h - 6} fill="#5C4034" />
      {/* statue */}
      <Rect x={statue.x - 2} y={statue.y + statue.h - 12} width={statue.w + 4} height="12" rx="2" fill="#8A8178" />
      <Ellipse cx={statue.x + statue.w / 2} cy={statue.y + 12} rx={statue.w / 3} ry="11" fill="#A39A90" />
      <Rect x={statue.x + 4} y={statue.y + 20} width={statue.w - 8} height={statue.h - 32} rx="6" fill="#A39A90" />
      <Rect x="0" y="350" width="390" height="70" fill="url(#floorFade)" />
    </G>
  );
}

function Outdoors({ pal }: { pal: PlacePalette }) {
  return (
    <G>
      <Rect width="390" height="420" fill="url(#sky)" />
      <Circle cx="300" cy="230" r="34" fill={pal.sun ?? scene.lamp} opacity="0.9" />
      <Path d="M0 250 Q80 200 170 240 T390 225 L390 420 L0 420 Z" fill={pal.hills ?? scene.hillsFar} />
      {[30, 70, 330, 365].map((x, i) => (
        <G key={x}>
          <Path d={`M${x} ${270 - (i % 2) * 14} l-22 50 h44 Z`} fill={pal.trees ?? '#3E5A4B'} />
          <Rect x={x - 3} y={318 - (i % 2) * 14} width="6" height="10" fill="#4A3C37" />
        </G>
      ))}
      <Path d="M0 300 Q120 275 220 296 T390 290 L390 420 L0 420 Z" fill={pal.bottom} />
      {[60, 140, 250, 320].map((x) => (
        <Path key={x} d={`M${x} 340 q3 -10 6 0 q3 -12 6 0`} stroke="#5E7D63" strokeWidth="2" fill="none" />
      ))}
      <Rect x="0" y="350" width="390" height="70" fill="url(#floorFade)" />
    </G>
  );
}
