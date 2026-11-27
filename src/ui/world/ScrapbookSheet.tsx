import { View } from 'react-native';
import { QUEST_TEMPLATES } from '@/src/content/quests';
import { regionById } from '@/src/content/regions';
import type { SaveData } from '@/src/game/types';
import { progressOf } from '@/src/game/world';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '../kit/Card';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

type Props = { regionId: string | null; save: SaveData; onClose: () => void };

/** Mementos from each adventure's first clear. Unfound ones show as silhouettes with a hint. */
export function ScrapbookSheet({ regionId, save, onClose }: Props) {
  const { c } = useTheme();
  const region = regionId ? regionById(regionId) : undefined;
  const found = region ? progressOf(save, region.id).mementos : [];
  return (
    <Sheet visible={!!region} title={region ? `Scrapbook: ${region.name}` : ''} onClose={onClose}>
      <View style={{ gap: space.m }}>
        {region?.adventures.map((a) => {
          const has = found.includes(a.memento.id);
          const name = QUEST_TEMPLATES.find((t) => t.id === a.id)?.name ?? a.id;
          return (
            <Card key={a.id} style={{ flexDirection: 'row', gap: space.m, alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: radius.button, backgroundColor: has ? c.accent : c.surfaceSunk, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="title" color={has ? 'onAccent' : 'textMuted'}>{has ? '✦' : '?'}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{has ? a.memento.name : 'Not found yet'}</Text>
                <Text variant="caption" color="textMuted">{has ? a.memento.description : `Clear ${name} to find this.`}</Text>
              </View>
            </Card>
          );
        })}
      </View>
    </Sheet>
  );
}
