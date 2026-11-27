import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { QUEST_BASE_MS , BOSS_TOKENS_NEEDED } from '@/src/game/config';
import { powerOf, speedFactor } from '@/src/game/stats';
import { availableBosses, bossChance, bossTokens } from '@/src/game/bosses';
import { currentRegion, progressOf } from '@/src/game/world';
import type { BossDifficulty , QuestOffer, SaveData } from '@/src/game/types';
import { formatDuration } from '../format';
import { successChance } from '@/src/game/quests';
import type { ColorTokens } from '@/src/theme/tokens';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

const DIFF_LABEL = { easy: 'Easy', normal: 'Normal', hard: 'Hard' } as const;

function chanceTone(chance: number): keyof ColorTokens {
  return chance >= 1 ? 'primary' : chance >= 0.5 ? 'accent' : 'ember';
}

const ON_TONE: Record<string, keyof ColorTokens> = { primary: 'onPrimary', accent: 'onAccent', ember: 'onEmber' };

type BossPick = { bossId: string; difficulty: BossDifficulty };
type Props = { visible: boolean; save: SaveData; onClose: () => void; onStart: (offerId: string, boss?: BossPick) => void };

const BOSS_DIFF: { d: BossDifficulty; label: string }[] = [
  { d: 'normal', label: 'Normal' },
  { d: 'hard', label: 'Hard' },
  { d: 'extreme', label: 'Extreme' },
];

export function QuestBoardSheet({ visible, save, onClose, onStart }: Props) {
  const { c } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const power = powerOf(save.player);
  const offers = save.board?.offers ?? [];
  const chosen = offers.find((o) => o.id === selected);
  const region = currentRegion(save);
  const cleared = progressOf(save, region.id).cleared;
  const bossReady = bossTokens(save) >= BOSS_TOKENS_NEEDED;
  const bosses = availableBosses(save);
  const [bossId, setBossId] = useState<string | null>(bosses[0]?.id ?? null);
  const [difficulty, setDifficulty] = useState<BossDifficulty>('normal');
  const boss = bossReady ? bosses.find((b) => b.id === bossId) : undefined;

  const choice = (label: string, selectedNow: boolean, onPress: () => void, detail?: string) => (
    <Pressable
      key={label}
      accessibilityRole="radio"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      accessibilityState={{ checked: selectedNow }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        minHeight: 44,
        paddingHorizontal: space.m,
        paddingVertical: space.s,
        borderRadius: radius.button,
        borderWidth: selectedNow ? 2 : 1,
        borderColor: selectedNow ? c.ember : c.line,
        backgroundColor: c.surface,
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text variant="bodyStrong">{label}</Text>
      {detail ? <Text variant="caption" color="textMuted">{detail}</Text> : null}
    </Pressable>
  );

  const card = (o: QuestOffer) => {
    const chance = successChance(power, o.requiredPower);
    const isSel = o.id === selected;
    return (
      <Pressable
        key={o.id}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSel }}
        accessibilityLabel={`${o.name}, ${DIFF_LABEL[o.difficulty]}, ${Math.round(chance * 100)} percent chance, ${o.rewardExp} EXP and ${o.rewardGold} gold`}
        onPress={() => setSelected(o.id)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
          backgroundColor: c.surface,
          borderRadius: radius.card,
          borderWidth: isSel ? 2 : 1,
          borderColor: isSel ? c.primary : c.line,
          padding: space.l,
          gap: space.s,
        })}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" color="textMuted">{DIFF_LABEL[o.difficulty]} · {formatDuration(QUEST_BASE_MS * speedFactor(save.player))}</Text>
          <View style={{ backgroundColor: c[chanceTone(chance)], borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: 2 }}>
            <Text variant="label" color={ON_TONE[chanceTone(chance)]}>
              {Math.round(chance * 100)}%
            </Text>
          </View>
        </View>
        <Text variant="heading">{o.name}</Text>
        <Text variant="caption" color={cleared.includes(o.templateId) ? 'textMuted' : 'accent'}>
          {cleared.includes(o.templateId) ? 'Memento found' : 'First clear: memento'}
        </Text>
        <Text color="textMuted">{o.flavour}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: space.m }}>
          <Text variant="caption" color="textMuted">Needs {o.requiredPower} power · you have {power}</Text>
          <Text variant="caption" color="text">+{o.rewardExp} EXP · +{o.rewardGold} gold</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Sheet visible={visible} title={`Adventures in ${region.name}`} onClose={onClose}>
      <View style={{ gap: space.m }} accessibilityRole="radiogroup">
        {offers.map(card)}
        {bossReady && (
          <View style={{ gap: space.s, marginTop: space.s }}>
            <Text variant="heading" accessibilityRole="header">A boss awaits</Text>
            <Text variant="caption" color="textMuted">You have 6 boss tokens. Add a boss fight to this trip, or save it for later.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }} accessibilityRole="radiogroup">
              {bosses.map((b) => choice(b.name, bossId === b.id, () => setBossId(b.id)))}
              {choice('Not today', bossId === null, () => setBossId(null))}
            </View>
            {boss && (
              <View style={{ flexDirection: 'row', gap: space.s }} accessibilityRole="radiogroup">
                {BOSS_DIFF.map(({ d, label }) =>
                  choice(label, difficulty === d, () => setDifficulty(d), `${Math.round(bossChance(save.player, boss, d) * 100)}%`),
                )}
              </View>
            )}
          </View>
        )}
        <Button
          title={chosen ? `Set out: ${chosen.name}${boss ? ` + ${boss.name} (${BOSS_DIFF.find((x) => x.d === difficulty)!.label})` : ''}` : 'Choose an adventure above'}
          disabled={!chosen}
          onPress={() => {
            if (chosen) onStart(chosen.id, boss ? { bossId: boss.id, difficulty } : undefined);
            setSelected(null);
          }}
        />
      </View>
    </Sheet>
  );
}
