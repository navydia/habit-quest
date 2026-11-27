import { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { addExp } from '@/src/game/progression';
import type { Player, QuestResult } from '@/src/game/types';
import { space } from '@/src/theme/tokens';
import { useReducedMotion, useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Card } from '../kit/Card';
import { Text } from '../kit/Text';

const SUCCESS_LINES = ['Back before supper. Not bad, adventurer.', 'The job is done, and done properly.', 'The town owes you one. They will pay in gold.'];
const FAIL_LINES = ['The slimes had numbers today.', 'Not every road goes your way.', 'A tough one. You came back in one piece.'];

/** Varies the line by return time, so it isn't the same every day. */
export function pickLine(resolvedAt: string, lines: string[]): string {
  let h = 0;
  for (const ch of resolvedAt) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}

type Props = { result: QuestResult | null; player: Player; onCollect: () => void };

export function ReturnReveal({ result, player, onCollect }: Props) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(0.6)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    if (!result) return;
    setShowLog(false);
    scale.setValue(reduced ? 1 : 0.6);
    if (!reduced) {
      Animated.spring(scale, { toValue: 1, damping: 9, stiffness: 160, useNativeDriver: true }).start();
      const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
      return () => loop.stop();
    }
  }, [result, reduced, scale, spin]);

  if (!result) return null;
  const lines = result.success ? SUCCESS_LINES : FAIL_LINES;
  const line = pickLine(result.resolvedAt, lines);
  const levelsGained = addExp(player, result.exp).levelsGained;

  return (
    <Modal visible animationType="fade" onRequestClose={onCollect}>
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <Text variant="label" color={result.success ? 'primary' : 'textMuted'}>
          {result.success ? 'Quest complete' : 'Quest not completed'}
        </Text>
        <Text variant="display" accessibilityRole="header" style={{ textAlign: 'center' }}>Your hero has returned!</Text>
        <Text variant="heading" color="textMuted">{result.offer.name}</Text>

        {showLog && result.story ? (
          <Card style={styles.log}>
            <Text variant="label" color="textMuted">From the quest log</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              <Text>{result.story}</Text>
            </ScrollView>
          </Card>
        ) : (
          <View style={styles.art}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
            <Svg width="100%" height="100%" viewBox="-100 -100 200 200">
              <G opacity={0.25}>
                {Array.from({ length: 12 }, (_, i) => (
                  <Path key={i} d="M-6 -30 L0 -96 L6 -30 Z" fill={c.accent} transform={`rotate(${i * 30})`} />
                ))}
              </G>
            </Svg>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Svg width={110} height={110} viewBox="0 0 110 110">
              <Circle cx="55" cy="58" r="44" fill="#9A6820" />
              <Circle cx="55" cy="52" r="44" fill={c.accent} />
              <Circle cx="55" cy="52" r="32" fill="none" stroke="#F6D18B" strokeWidth="4" />
              <Path d="M55 32 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2 z" fill="#F6D18B" />
            </Svg>
          </Animated.View>
        </View>

        )}
        <Text style={{ textAlign: 'center' }}>
          {line}
          {!result.success ? ` You still came back with ${result.gold} gold.` : ''}
        </Text>
        <View style={styles.rewards}>
          <Reward value={`+${result.exp}`} label="EXP" />
          <Reward value={`+${result.gold}`} label="Gold" />
        </View>
        {levelsGained > 0 && (
          <View style={[styles.banner, { backgroundColor: c.primary }]}>
            <Text variant="bodyStrong" color="onPrimary">Level up · you are now level {player.level + levelsGained}</Text>
          </View>
        )}
        <View style={styles.actions}>
          <Button title="Collect" variant="reward" onPress={onCollect} />
          {result.story ? (
            <Button
              title={showLog ? 'Hide quest log' : 'Read quest log'}
              variant="secondary"
              onPress={() => setShowLog((v) => !v)}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Reward({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="title">{value}</Text>
      <Text variant="label" color="textMuted">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxxl, gap: space.l },
  art: { width: 240, height: 200, alignItems: 'center', justifyContent: 'center' },
  rewards: { flexDirection: 'row', gap: space.huge },
  log: { alignSelf: 'stretch', gap: space.s },
  actions: { alignSelf: 'stretch', gap: space.m },
  banner: { paddingHorizontal: space.l, paddingVertical: space.s, borderRadius: 999 },
});
