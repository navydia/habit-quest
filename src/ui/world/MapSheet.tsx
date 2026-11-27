import { View } from 'react-native';
import { REGIONS } from '@/src/content/regions';
import type { SaveData } from '@/src/game/types';
import { canTravel, currentRegion, isRegionComplete, lockReason, progressOf } from '@/src/game/world';
import { space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Card } from '../kit/Card';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

type Props = { visible: boolean; save: SaveData; now: Date; onClose: () => void; onTravel: (id: string) => void; onScrapbook: (id: string) => void; onGoHome: () => void };

export function MapSheet({ visible, save, now, onClose, onTravel, onScrapbook, onGoHome }: Props) {
  const { c } = useTheme();
  const atHome = save.world.atHome !== false;
  // The region you are standing in (none while at home).
  const here = atHome ? '' : currentRegion(save).id;
  return (
    <Sheet visible={visible} title="The map" onClose={onClose}>
      <View style={{ gap: space.m }}>
        <Card style={{ gap: space.s, borderColor: atHome ? c.primary : c.line, borderWidth: atHome ? 2 : 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text variant="heading">🏡 Home</Text>
            <Text variant="label" color={atHome ? 'primary' : 'textMuted'}>{atHome ? 'You are here' : ''}</Text>
          </View>
          <Text color="textMuted">Your cottage. Adventures still come from {currentRegion(save).name}.</Text>
          {!atHome && <Button title="Go home" onPress={onGoHome} disabled={!!save.activeRun} />}
        </Card>
        {REGIONS.map((r) => {
          const prog = progressOf(save, r.id);
          const locked = lockReason(save, r.id);
          const travel = canTravel(save, r.id, now);
          const status = r.id === here ? 'You are here' : isRegionComplete(save, r.id) ? 'Complete' : locked ? 'Locked' : 'Unlocked';
          return (
            <Card key={r.id} style={{ gap: space.s, borderColor: r.id === here ? c.primary : c.line, borderWidth: r.id === here ? 2 : 1, opacity: locked ? 0.75 : 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text variant="heading">{r.name}</Text>
                <Text variant="label" color={r.id === here ? 'primary' : 'textMuted'}>{status}</Text>
              </View>
              <Text color="textMuted">{r.blurb}</Text>
              <Text variant="caption" color="textMuted">
                {r.minPower ? `Needs ${r.minPower} power · ` : ''}Adventures cleared {prog.cleared.length} / 3 · Boss {prog.bossDefeated ? 'beaten' : 'not yet beaten'}
              </Text>
              {locked && <Text variant="caption">{locked}</Text>}
              <View style={{ flexDirection: 'row', gap: space.s }}>
                {!locked && r.id !== here && (
                  <View style={{ flex: 1 }}>
                    <Button title={`Travel to ${r.name}`} onPress={() => onTravel(r.id)} disabled={!travel.ok} />
                  </View>
                )}
                {!locked && (
                  <View style={{ flex: 1 }}>
                    <Button title="Scrapbook" variant="secondary" onPress={() => onScrapbook(r.id)} />
                  </View>
                )}
              </View>
              {!locked && r.id !== here && !travel.ok && <Text variant="caption" color="textMuted">{travel.reason}</Text>}
            </Card>
          );
        })}
      </View>
    </Sheet>
  );
}
