import Svg, { Circle, Path } from 'react-native-svg';

/** Boss token: a red coin with a white dragon-head silhouette. Faded when not yet earned. */
export function DragonToken({ size = 30, earned }: { size?: number; earned: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" opacity={earned ? 1 : 0.3}>
      <Circle cx="20" cy="20" r="19" fill="#7A2A20" />
      <Circle cx="20" cy="20" r="16" fill="#C0392B" />
      <Path
        d="M10 27 C11 20 14 15 19 13 L17 9 L22 12 L25 8 L25.5 13 C28 14 30 16 31 18 L27 18.5 L30.5 20.5 L26 21 L28 23.5 L23.5 22.5 C22.5 25 20.5 27 18 28 L19 31 L15.5 29 L13 31.5 L13.5 28 Z"
        fill="#FFF6EE"
      />
      <Circle cx="21.5" cy="16" r="1.3" fill="#C0392B" />
    </Svg>
  );
}

/** Rounded check mark, drawn to match Nunito Sans' rounded strokes. */
export function CheckIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Sliders icon for the sort/filter button. */
export function SlidersIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx="16" cy="7" r="2.4" stroke={color} strokeWidth={2.2} fill="none" />
      <Circle cx="10" cy="17" r="2.4" stroke={color} strokeWidth={2.2} fill="none" />
    </Svg>
  );
}

/** Cog for "Customize". */
export function CogIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={2} fill="none" />
      <Path
        d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="6.6" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

/** A drawstring bag (the potion bag on the Character box). */
export function BagIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 3.5h6l-1.6 3.2h-2.8z" stroke={color} strokeWidth={2} strokeLinejoin="round" fill="none" />
      <Path
        d="M10.6 6.7C6.4 8.4 4 11.6 4 15.4 4 18.9 6.6 21 12 21s8-2.1 8-5.6c0-3.8-2.4-7-6.6-8.7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M9.5 8.2h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
