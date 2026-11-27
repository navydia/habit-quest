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
      </Defs>
      {pal.kind === 'home' ? <Cottage /> : <Outdoors pal={pal} />}
    </Svg>
  );
}

function Cottage() {
  return (
    <G>
      <Rect width="390" height="420" fill={placeOf('home').top} />
      {[40, 110, 180, 250, 320].map((x) => (
        <Rect key={x} x={x} y="0" width="3" height="300" fill={scene.wallShade} opacity="0.5" />
      ))}
      {/* round window onto the dusk */}
      <Circle cx="285" cy="120" r="56" fill={scene.wallShade} />
      <Circle cx="285" cy="120" r="48" fill="url(#sky)" />
      <Path d="M245 150 Q270 128 300 146 T330 140 L330 168 L240 168 Z" fill={scene.hillsFar} />
      <Rect x="283" y="72" width="4" height="96" fill={scene.wallShade} />
      <Rect x="237" y="118" width="96" height="4" fill={scene.wallShade} />
      {/* shelf */}
      <Rect x="40" y="150" width="110" height="8" rx="3" fill={scene.floor} />
      <Rect x="52" y="126" width="14" height="24" rx="3" fill="#7E8F6A" />
      <Rect x="70" y="132" width="12" height="18" rx="3" fill="#A06A4F" />
      <Circle cx="112" cy="140" r="10" fill="#C79A5B" />
      {/* hanging lamp */}
      <Rect x="160" y="0" width="2" height="70" fill={scene.wallShade} />
      <Circle cx="161" cy="86" r="70" fill="url(#lampGlow)" />
      <Path d="M146 70 L176 70 L170 88 L152 88 Z" fill="#D9B46A" />
      {/* floor and rug */}
      <Rect x="0" y="300" width="390" height="120" fill={placeOf('home').bottom} />
      <Rect x="0" y="300" width="390" height="6" fill={scene.wallShade} opacity="0.6" />
      <Ellipse cx="195" cy="372" rx="130" ry="26" fill="#8C4F3F" opacity="0.85" />
      <Ellipse cx="195" cy="372" rx="108" ry="19" fill="none" stroke="#C9892B" strokeWidth="3" opacity="0.6" />
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
    </G>
  );
}
