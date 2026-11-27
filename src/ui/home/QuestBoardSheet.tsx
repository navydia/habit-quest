import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { QUEST_BASE_MS } from '@/src/game/config';
import { powerRating } from '@/src/game/progression';
import { successChance } from '@/src/game/quests';
import type { QuestOffer, SaveData } from '@/src/game/types';
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

type Props = { visible: boolean; save: SaveData; onClose: () => void; onStart: (offerId: string) => void };

export function QuestBoardSheet({ visible, save, onClose, onStart }: Props) {
  const { c } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const power = powerRating(save.player.level);
  const offers = save.board?.offers ?? [];
  const chosen = offers.find((o) => o.id === selected);

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
        style={{
          backgroundColor: c.surface,
          borderRadius: radius.card,
          borderWidth: isSel ? 2 : 1,
          borderColor: isSel ? c.primary : c.line,
          padding: space.l,
          gap: space.s,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" color="textMuted">{DIFF_LABEL[o.difficulty].toUpperCase()} · {QUEST_BASE_MS / 3600_000}H</Text>
          <View style={{ backgroundColor: c[chanceTone(chance)], borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: 2 }}>
            <Text variant="label" color={chanceTone(chance) === 'accent' ? 'onAccent' : 'onPrimary'} style={chanceTone(chance) === 'ember' ? { color: '#FFFFFF' } : undefined}>
              {Math.round(chance * 100)}%
            </Text>
          </View>
        </View>
        <Text variant="heading">{o.name}</Text>
        <Text color="textMuted">{o.flavour}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" color="textMuted">Needs {o.requiredPower} power · you have {power}</Text>
          <Text variant="caption" color="text">+{o.rewardExp} EXP · +{o.rewardGold} gold</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Sheet visible={visible} title="Choose today's quest" onClose={onClose}>
      <View style={{ gap: space.m }} accessibilityRole="radiogroup">
        {offers.map(card)}
        <Button
          title={chosen ? `Set out: ${chosen.name}` : 'Pick a quest'}
          disabled={!chosen}
          onPress={() => {
            if (chosen) onStart(chosen.id);
            setSelected(null);
          }}
        />
      </View>
    </Sheet>
  );
}
