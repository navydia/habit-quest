import { useEffect, useState } from 'react';
import { ScrollView , Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { addExp } from '@/src/game/progression';
import type { Player, QuestResult } from '@/src/game/types';
import { space , rarity as rarityColors } from '@/src/theme/tokens';
import { useReducedMotion, useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Card } from '../kit/Card';
import { gearById, RARITY_LABEL } from '@/src/content/gear';
import { BossFigure } from './BossFigure';
import { statLine } from '../character/gearText';
import { bossById, familiarById, regionById } from '@/src/content/regions';
import { Text } from '../kit/Text';

const SUCCESS_LINES = ['Back before supper. Not bad, adventurer.', 'The job is done, and done properly.', 'The town owes you one. They will pay in gold.'];
const FAIL_LINES = ['The slimes had numbers today.', 'Not every road goes your way.', 'A tough one. You came back in one piece.'];

/** Varies the line by return time, so it isn't the same every day. */
export function pickLine(resolvedAt: string, lines: string[]): string {
  let h = 0;
  for (const ch of resolvedAt) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return lines[h % lines.length];
}

type Bonus = { exp: number; gold: number; label: string | null };
type Props = { result: QuestResult | null; player: Player; bonus?: Bonus; onCollect: (equipDrop: boolean) => void };

const NO_BONUS: Bonus = { exp: 1, gold: 1, label: null };

export function ReturnReveal({ result, player, bonus = NO_BONUS, onCollect }: Props) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const scale = useState(() => new Animated.Value(0.6))[0];
  const spin = useState(() => new Animated.Value(0))[0];
  // Remember which result's log is open, so a new result starts with it closed.
  const [logFor, setLogFor] = useState<string | null>(null);
  const showLog = !!result && logFor === result.resolvedAt;

  useEffect(() => {
    if (!result) return;
    scale.setValue(reduced ? 1 : 0.6);
    if (!reduced) {
      Animated.spring(scale, { toValue: 1, damping: 9, stiffness: 160, useNativeDriver: true }).start();
      const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
      return () => loop.stop();
    }
  }, [result, reduced, scale, spin]);

  if (!result) return null;
  const lines =
    result.kind === 'boss'
      ? result.success
        ? ['A fight for the ages. The road is quieter for it.']
        : ['The boss held its ground. Rest up, then try again.']
      : result.success
        ? SUCCESS_LINES
        : FAIL_LINES;
  const line = pickLine(result.resolvedAt, lines);
  // Same maths as collectResult, so the numbers and the level-up banner match what you get.
  const totalExp = Math.round((result.exp + (result.boss?.exp ?? 0)) * bonus.exp);
  const levelsGained = addExp(player, totalExp).levelsGained;
  const drop = result.drop ? gearById(result.drop.gearId) : undefined;
  const memento = result.memento ? regionById(result.memento.regionId)?.adventures.find((a) => a.memento.id === result.memento!.mementoId)?.memento : undefined;
  const bossResult = result.boss;
  const bossDef = bossResult ? bossById(bossResult.bossId) : undefined;
  const bossDrop = bossResult?.drop ? gearById(bossResult.drop.gearId) : undefined;
  const familiar = bossResult?.familiarId ? familiarById(bossResult.familiarId) : undefined;

  // Four distinct looks: adventure win / loss, boss win / loss.
  const mood: Mood = result.kind === 'boss' ? (bossResult?.success ? 'bossWin' : 'bossLoss') : result.success ? 'win' : 'loss';
  const th = MOODS[mood];
  const label = { win: 'Adventure complete', loss: 'The adventure went sideways', bossWin: 'Boss defeated', bossLoss: 'The boss held on' }[mood];

  return (
    <Modal visible animationType="fade" onRequestClose={() => onCollect(false)}>
      <ScrollView style={{ backgroundColor: th.bg }} contentContainerStyle={styles.root}>
        <Text variant="label" style={{ color: th.accent }}>{label}</Text>
        <Text variant="display" accessibilityRole="header" style={{ textAlign: 'center', color: th.text }}>
          {mood === 'bossWin' ? 'Victory!' : mood === 'bossLoss' ? 'Not this time' : 'Your hero has returned!'}
        </Text>
        <Text variant="heading" style={{ color: th.muted }}>{result.offer.name}</Text>

        {showLog && result.story ? (
          <Card style={styles.log}>
            <Text variant="label" color="textMuted">From the adventure log</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              <Text>{result.story}</Text>
            </ScrollView>
          </Card>
        ) : (
          <View style={styles.art}>
            {th.rays && (
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
                <Svg width="100%" height="100%" viewBox="-100 -100 200 200">
                  <G opacity={0.3}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <Path key={i} d="M-6 -30 L0 -96 L6 -30 Z" fill={th.rays} transform={`rotate(${i * 30})`} />
                    ))}
                  </G>
                </Svg>
              </Animated.View>
            )}
            <Animated.View style={{ transform: [{ scale }] }}>
              {mood === 'win' && <ChestArt />}
              {mood === 'loss' && <LanternArt />}
              {(mood === 'bossWin' || mood === 'bossLoss') && bossDef && (
                <View style={{ opacity: mood === 'bossWin' ? 0.55 : 1, transform: [{ rotate: mood === 'bossWin' ? '-12deg' : '0deg' }] }}>
                  <BossFigure bossId={bossDef.id} name={bossDef.name} reduced inline size={mood === 'bossLoss' ? 170 : 140} />
                </View>
              )}
              {mood === 'bossWin' && <Text style={{ position: 'absolute', alignSelf: 'center', top: '40%', fontSize: 44 }} accessibilityElementsHidden>🏆</Text>}
            </Animated.View>
          </View>
        )}
        <Text style={{ textAlign: 'center', color: th.text }}>
          {line}
          {!result.success && result.kind !== 'boss' ? ` You still came back with ${result.gold} gold.` : ''}
        </Text>
        {result.kind !== 'boss' && (
        <View style={styles.rewards}>
          <Reward value={`+${Math.round(result.exp * bonus.exp)}`} label="EXP" color={th.text} muted={th.muted} />
          <Reward value={`+${Math.round(result.gold * bonus.gold)}`} label="Gold" color={th.text} muted={th.muted} />
        </View>
        )}
        {bonus.label && <Text variant="caption" style={{ color: th.muted }}>{bonus.label}</Text>}
        {drop && (
          <Card style={[styles.log, { borderLeftWidth: 4, borderLeftColor: rarityColors[drop.rarity] }]}>
            <Text variant="label" color="textMuted">Found on the road · {RARITY_LABEL[drop.rarity]}</Text>
            <Text variant="heading">{drop.name}</Text>
            <Text variant="caption" color="textMuted">{statLine(drop)}</Text>
          </Card>
        )}
        {memento && (
          <Card style={[styles.log, { borderLeftWidth: 4, borderLeftColor: c.accent }]}>
            <Text variant="label" color="textMuted">New memento for your scrapbook</Text>
            <Text variant="heading">{memento.name}</Text>
            <Text variant="caption" color="textMuted">{memento.description}</Text>
          </Card>
        )}
        {bossResult && bossDef && (
          <Card style={[styles.log, { borderLeftWidth: 4, borderLeftColor: c.ember }]}>
            <Text variant="label" color="ember">{bossResult.success ? 'Boss defeated' : 'The boss held on'}</Text>
            <Text variant="heading">{bossDef.name}</Text>
            <Text variant="caption" color="textMuted">
              {bossResult.success
                ? `+${bossResult.exp} EXP · +${bossResult.gold} gold${bossDrop ? ` · ${bossDrop.name} (${RARITY_LABEL[bossDrop.rarity]})` : ''}`
                : 'Your 6 tokens were spent. Earn six more and try again.'}
            </Text>
          </Card>
        )}
        {familiar && (
          <Card style={[styles.log, { borderLeftWidth: 4, borderLeftColor: c.primary }]}>
            <Text variant="label" color="primary">A familiar joins you</Text>
            <Text variant="heading">{familiar.name}</Text>
            <Text variant="caption" color="textMuted">{familiar.description}</Text>
          </Card>
        )}
        {levelsGained > 0 && (
          <View style={[styles.banner, { backgroundColor: c.primary }]}>
            <Text variant="bodyStrong" color="onPrimary">Level up · you are now level {player.level + levelsGained}</Text>
          </View>
        )}
        <View style={styles.actions}>
          <Button title="Collect" variant="reward" onPress={() => onCollect(false)} />
          {drop && <Button title="Collect and equip" variant="secondary" onPress={() => onCollect(true)} />}
          {result.story ? (
            <Button
              title={showLog ? 'Hide adventure log' : 'Read adventure log'}
              variant="secondary"
              onPress={() => setLogFor(showLog ? null : result.resolvedAt)}
            />
          ) : null}
        </View>
      </ScrollView>
    </Modal>
  );
}

type Mood = 'win' | 'loss' | 'bossWin' | 'bossLoss';
/** Fixed palettes (not theme tokens): each result screen has its own mood in light and dark mode. */
const MOODS: Record<Mood, { bg: string; text: string; muted: string; accent: string; rays?: string }> = {
  win: { bg: '#FFF3DA', text: '#2A2623', muted: '#5E554D', accent: '#7A5212', rays: '#E3B25A' },
  loss: { bg: '#2E3644', text: '#EEF0F4', muted: '#C3C9D4', accent: '#A9C1E0' },
  bossWin: { bg: '#5A1E1A', text: '#FFF3E6', muted: '#F2D1C4', accent: '#F6D18B', rays: '#F6D18B' },
  bossLoss: { bg: '#1E1A1C', text: '#F2ECEF', muted: '#C9BFC4', accent: '#F2A48E' },
};

function ChestArt() {
  return (
    <Svg width={130} height={110} viewBox="0 0 130 110" accessibilityElementsHidden>
      <Path d="M15 50 Q15 20 65 20 Q115 20 115 50 Z" fill="#8C5A2B" />
      <Path d="M15 50 H115 V98 Q115 104 109 104 H21 Q15 104 15 98 Z" fill="#A86B34" />
      <Path d="M15 50 H115 V60 H15 Z" fill="#D49A2A" />
      <Path d="M58 52 H72 V72 H58 Z" fill="#F6D18B" />
      <Circle cx="65" cy="62" r="3" fill="#7A5212" />
      <Circle cx="40" cy="22" r="5" fill="#F6D18B" />
      <Circle cx="92" cy="18" r="4" fill="#F6D18B" />
    </Svg>
  );
}

function LanternArt() {
  return (
    <Svg width={100} height={130} viewBox="0 0 100 130" accessibilityElementsHidden>
      <Circle cx="50" cy="75" r="42" fill="#F6D18B" opacity={0.18} />
      <Path d="M40 18 Q50 6 60 18" stroke="#C3C9D4" strokeWidth="4" fill="none" />
      <Path d="M32 28 H68 L64 36 H36 Z" fill="#6E7891" />
      <Path d="M36 36 H64 V96 H36 Z" fill="#F6D18B" opacity={0.85} />
      <Path d="M36 36 H64 V96 H36 Z" fill="none" stroke="#6E7891" strokeWidth="4" />
      <Path d="M30 96 H70 V104 H30 Z" fill="#6E7891" />
      <Path d="M50 52 Q56 62 50 74 Q44 62 50 52 Z" fill="#E08467" />
    </Svg>
  );
}

function Reward({ value, label, color, muted }: { value: string; label: string; color: string; muted: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="title" style={{ color }}>{value}</Text>
      <Text variant="label" style={{ color: muted }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // flexGrow centres short content and lets long content (drop + level-up) scroll instead of clipping.
  root: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, paddingVertical: space.huge, gap: space.l },
  art: { width: 240, height: 200, alignItems: 'center', justifyContent: 'center' },
  rewards: { flexDirection: 'row', gap: space.huge },
  log: { alignSelf: 'stretch', gap: space.s },
  actions: { alignSelf: 'stretch', gap: space.m },
  banner: { paddingHorizontal: space.l, paddingVertical: space.s, borderRadius: 999 },
});
