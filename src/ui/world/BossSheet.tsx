import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { availableBosses, bossChance } from '@/src/game/bosses';
import type { BossDifficulty, SaveData } from '@/src/game/types';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

const DIFFS: { d: BossDifficulty; label: string; note: string }[] = [
  { d: 'normal', label: 'Normal', note: 'Standard rewards' },
  { d: 'hard', label: 'Hard', note: '×1.75 rewards, ×2 familiar chance' },
  { d: 'extreme', label: 'Extreme', note: '×3 rewards, ×4 familiar chance' },
];

type Props = {
  visible: boolean;
  save: SaveData;
  onClose: () => void;
  onFight: (bossId: string, difficulty: BossDifficulty) => void;
  onAdventureInstead: () => void;
};

/** The boss menu: replaces the adventure for today. Losing keeps your 6 tokens. */
export function BossSheet({ visible, save, onClose, onFight, onAdventureInstead }: Props) {
  const { c } = useTheme();
  const bosses = availableBosses(save);
  const [bossId, setBossId] = useState(bosses[0]?.id);
  const [difficulty, setDifficulty] = useState<BossDifficulty>('normal');
  const boss = bosses.find((b) => b.id === bossId) ?? bosses[0];

  const option = (key: string, title: string, detail: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityLabel={`${title}, ${detail}`}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({ padding: space.l, borderRadius: radius.card, borderWidth: selected ? 2 : 1, borderColor: selected ? c.ember : c.line, backgroundColor: c.surface, gap: 2, opacity: pressed ? 0.85 : 1 })}
    >
      <Text variant="heading">{title}</Text>
      <Text variant="caption" color="textMuted">{detail}</Text>
    </Pressable>
  );

  return (
    <Sheet visible={visible} title="Boss fight" onClose={onClose}>
      <View style={{ gap: space.m }}>
        <Text color="textMuted">Your 6 tokens summon a boss. The fight takes the place of today&rsquo;s adventure. Lose, and you keep your tokens.</Text>
        <View style={{ gap: space.s }} accessibilityRole="radiogroup" accessibilityLabel="Boss">
          {bosses.map((b) => option(b.id, b.name, b.flavour, b.id === boss?.id, () => setBossId(b.id)))}
        </View>
        {boss && (
          <>
            <Text variant="label" color="textMuted">Difficulty</Text>
            <View style={{ gap: space.s }} accessibilityRole="radiogroup" accessibilityLabel="Difficulty">
              {DIFFS.map((x) => option(x.d, `${x.label} · ${Math.round(bossChance(save.player, boss, x.d) * 100)}%`, x.note, difficulty === x.d, () => setDifficulty(x.d)))}
            </View>
            <Button title={`Fight ${boss.name} (${DIFFS.find((x) => x.d === difficulty)!.label})`} variant="reward" onPress={() => onFight(boss.id, difficulty)} />
          </>
        )}
        <Pressable accessibilityRole="button" onPress={onAdventureInstead} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="bodyStrong" color="primary">Go adventuring instead (keep your tokens)</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}
