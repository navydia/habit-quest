import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { STAT_KEYS, gearStats } from '@/src/game/stats';
import type { Player, StatKey } from '@/src/game/types';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Card } from '../kit/Card';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

export const STAT_INFO: Record<StatKey, { name: string; hint: string }> = {
  power: { name: 'Power', hint: 'Raises your power rating' },
  defense: { name: 'Defense', hint: 'Helps against bosses' },
  luck: { name: 'Luck', hint: 'Better drops' },
  speed: { name: 'Speed', hint: 'Shorter adventures' },
};

type Props = { player: Player; onAdd: (s: StatKey) => void; onReset: () => void };

export function StatsCard({ player, onAdd, onReset }: Props) {
  const { c } = useTheme();
  const [confirm, setConfirm] = useState(false);
  const gear = gearStats(player);
  const canSpend = player.unspentSp > 0;

  return (
    <Card style={{ gap: space.m }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="heading" accessibilityRole="header">Stats</Text>
        {canSpend && (
          <View style={{ backgroundColor: c.accent, borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: 2 }}>
            <Text variant="label" color="onAccent">{player.unspentSp} {player.unspentSp === 1 ? 'point' : 'points'} to spend</Text>
          </View>
        )}
      </View>
      {STAT_KEYS.map((k) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m, minHeight: minTouch }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{STAT_INFO[k].name}</Text>
            <Text variant="caption" color="textMuted">{STAT_INFO[k].hint}</Text>
          </View>
          <Text variant="title" style={{ minWidth: 28, textAlign: 'right' }}>{player.stats[k] + gear[k]}</Text>
          <Text variant="caption" color="textMuted" style={{ minWidth: 52 }}>{gear[k] ? `(+${gear[k]} gear)` : ''}</Text>
          {canSpend && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Add a point to ${STAT_INFO[k].name}`}
              onPress={() => onAdd(k)}
              style={({ pressed }) => ({
                width: minTouch,
                height: minTouch,
                borderRadius: radius.button,
                backgroundColor: pressed ? c.primaryLip : c.primary,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text variant="title" color="onPrimary">+</Text>
            </Pressable>
          )}
        </View>
      ))}
      {player.spentSp > 0 && (
        <View style={{ marginTop: space.s }}>
          <Button title="Reset points" variant="secondary" onPress={() => setConfirm(true)} />
        </View>
      )}
      <Sheet visible={confirm} title="Reset your points?" onClose={() => setConfirm(false)}>
        <View style={{ gap: space.l }}>
          <Text color="textMuted">All {player.spentSp} points come back for you to spend again. It&rsquo;s free.</Text>
          <Button
            title={`Reset ${player.spentSp} points`}
            onPress={() => {
              onReset();
              setConfirm(false);
            }}
          />
          <Button title="Keep them" variant="secondary" onPress={() => setConfirm(false)} />
        </View>
      </Sheet>
    </Card>
  );
}
