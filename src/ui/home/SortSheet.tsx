import { Pressable, View } from 'react-native';
import type { SaveData } from '@/src/game/types';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

type GroupBy = SaveData['settings']['groupBy'];
const OPTIONS: { id: GroupBy; title: string; detail: string }[] = [
  { id: 'timeOfDay', title: 'Time of day', detail: 'Morning, afternoon, evening, anytime' },
  { id: 'lifeArea', title: 'Life area', detail: 'Health, mind, work and more' },
  { id: 'custom', title: 'Custom', detail: 'One list, in the order you drag them' },
];

export function SortSheet({ visible, value, onClose, onChoose }: { visible: boolean; value: GroupBy; onClose: () => void; onChoose: (g: GroupBy) => void }) {
  const { c } = useTheme();
  return (
    <Sheet visible={visible} title="Sort habits" onClose={onClose}>
      <View style={{ gap: space.s }} accessibilityRole="radiogroup">
        {OPTIONS.map((o) => (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityLabel={o.title}
            accessibilityState={{ checked: value === o.id }}
            onPress={() => {
              onChoose(o.id);
              onClose();
            }}
            style={({ pressed }) => ({ minHeight: minTouch + 12, padding: space.l, borderRadius: radius.card, borderWidth: value === o.id ? 2 : 1, borderColor: value === o.id ? c.primary : c.line, backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 })}
          >
            <Text variant="bodyStrong">{o.title}</Text>
            <Text variant="caption" color="textMuted">{o.detail}</Text>
          </Pressable>
        ))}
        <Text variant="caption" color="textMuted">Tip: long-press a habit and drag it to reorder. Dropping it in another section changes its time of day or life area.</Text>
      </View>
    </Sheet>
  );
}
