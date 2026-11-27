import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import { heroLayers } from '@/src/art/layers';
import { FRAME_H, FRAME_W, type Anim } from '@/src/art/types';
import type { Player } from '@/src/game/types';
import { useReducedMotion } from '@/src/theme/useTheme';

const TICK_FPS = 8;

type Props = {
  player: Player;
  anim: Anim;
  height?: number;
  accessibilityLabel?: string;
  /** Stop animating, e.g. while the tab is hidden, to save battery. */
  paused?: boolean;
};

/** Stacks the hero's art layers (src/art/layers.ts) and steps through sprite-strip frames. */
export function HeroSprite({ player, anim, height = 200, accessibilityLabel, paused = false }: Props) {
  const reduced = useReducedMotion();
  const scale = height / FRAME_H;
  const width = FRAME_W * scale;
  const layers = useMemo(() => heroLayers(player, anim), [player, anim]);
  const animated = !reduced && !paused && layers.some((l) => l.asset.frames > 1);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!animated) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000 / TICK_FPS);
    return () => clearInterval(id);
  }, [animated]);

  // Gentle breathing bob, for 1-frame idle art. Off with Reduce Motion.
  const [bob] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced || paused || anim !== 'idle') {
      bob.setValue(0);
      return;
    }
    const step = (to: number) => Animated.timing(bob, { toValue: to, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([step(1), step(0)]));
    loop.start();
    return () => loop.stop();
  }, [anim, bob, reduced, paused]);

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Your hero, ${player.title}`}
      style={{ width, height, transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }}
    >
      {layers.map(({ layer, asset }) => {
        const frame = animated ? Math.floor((tick * asset.fps) / TICK_FPS) % asset.frames : 0;
        return (
          <View key={layer} style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden' }}>
            <Image
              source={asset.src}
              style={{ width: width * asset.frames, height, transform: [{ translateX: -frame * width }] }}
              resizeMode="stretch"
            />
          </View>
        );
      })}
    </Animated.View>
  );
}
