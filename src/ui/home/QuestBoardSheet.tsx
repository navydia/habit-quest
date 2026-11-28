import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { QUEST_BASE_MS } from '@/src/game/config';
import { powerOf, speedFactor } from '@/src/game/stats';
import { currentRegion, progressOf } from '@/src/game/world';
import type { QuestOffer, SaveData } from '@/src/game/types';
import { formatDuration } from '../format';
import { successChance } from '@/src/game/quests';
import type { ColorTokens } from '@/src/theme/tokens';
import { board, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';
import { activePotionPower, PotionPicker } from '../character/PotionPicker';

const DIFF_LABEL = { easy: 'Easy', normal: 'Normal', hard: 'Hard' } as const;

function chanceTone(chance: number): keyof ColorTokens {
  return chance >= 1 ? 'primary' : chance >= 0.5 ? 'accent' : 'ember';
}

const ON_TONE: Record<string, keyof ColorTokens> = { primary: 'onPrimary', accent: 'onAccent', ember: 'onEmber' };

type Props = { visible: boolean; save: SaveData; onClose: () => void; onStart: (offerId: string) => void };

export function QuestBoardSheet({ visible, save, onClose, onStart }: Props) {
  const { c } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const power = powerOf(save.player) + activePotionPower(save);
  const offers = save.board?.offers ?? [];
  const chosen = offers.find((o) => o.id === selected);
  const region = currentRegion(save);
  const cleared = progressOf(save, region.id).cleared;
  const ink = { color: board.ink };
  const inkMuted = { color: board.inkMuted };
  const TILT = ['-1.6deg', '1.2deg', '-0.8deg'];
  /** A paper note pinned to the cork board. */
  const card = (o: QuestOffer, i: number) => {
    const chance = successChance(power, o.requiredPower);
    const isSel = o.id === selected;
    const tone = c[chanceTone(chance)];
    return (
      <Pressable
        key={o.id}
        accessibilityRole="radio"
        accessibilityState={{ checked: isSel }}
        accessibilityLabel={`${o.name}, ${DIFF_LABEL[o.difficulty]}, ${Math.round(chance * 100)} percent chance, needs ${o.requiredPower} power, ${o.rewardExp} EXP and ${o.rewardGold} gold`}
        onPress={() => setSelected(o.id)}
        style={({ pressed }) => ({
          transform: [{ rotate: isSel ? '0deg' : TILT[i % TILT.length] }, { scale: isSel ? 1.02 : pressed ? 0.99 : 1 }],
          backgroundColor: isSel ? board.paperSelected : board.paper,
          borderRadius: 6,
          borderWidth: isSel ? 3 : 0,
          borderColor: tone,
          padding: space.l,
          paddingTop: space.xl,
          gap: space.xs,
          shadowColor: '#000',
          shadowOpacity: isSel ? 0.3 : 0.18,
          shadowRadius: isSel ? 10 : 4,
          shadowOffset: { width: 0, height: isSel ? 6 : 3 },
          elevation: isSel ? 6 : 3,
        })}
      >
        <View style={{ position: 'absolute', top: 6, alignSelf: 'center', width: 14, height: 14, borderRadius: 7, backgroundColor: board.pin, borderWidth: 2, borderColor: '#7A3524' }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="label" style={inkMuted}>{DIFF_LABEL[o.difficulty]} · {formatDuration(QUEST_BASE_MS * speedFactor(save.player))}</Text>
          <View style={{ backgroundColor: tone, borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: 2 }}>
            <Text variant="label" color={ON_TONE[chanceTone(chance)]}>{Math.round(chance * 100)}%</Text>
          </View>
        </View>
        <Text variant="heading" style={ink}>{o.name}</Text>
        <Text style={inkMuted}>{o.flavour}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: space.m, marginTop: space.xs }}>
          <Text variant="caption" style={ink}>⚔ Needs {o.requiredPower} power (you: {power})</Text>
          <Text variant="caption" style={ink}>+{o.rewardExp} EXP · +{o.rewardGold} gold</Text>
        </View>
        <Text variant="caption" style={inkMuted}>{cleared.includes(o.templateId) ? '✦ Memento found' : '✦ First clear earns a memento'}</Text>
      </Pressable>
    );
  };

  return (
    <Sheet visible={visible} title={`Adventures in ${region.name}`} onClose={onClose}>
      <View style={{ gap: space.m }}>
        <View style={{ gap: space.l, backgroundColor: board.cork, borderRadius: radius.card, borderWidth: 6, borderColor: board.corkEdge, padding: space.l }} accessibilityRole="radiogroup" accessibilityLabel="Adventures">
          {offers.map((o, i) => card(o, i))}
        </View>
        <PotionPicker save={save} compact />
        <Button
          title={chosen ? `Set out: ${chosen.name}` : 'Choose an adventure above'}
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
