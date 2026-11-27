import { Pressable, View } from 'react-native';
import { REGIONS } from '@/src/content/regions';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '../kit/Card';
import { Text } from '../kit/Text';

type Props = { owned: string[]; active: string | null; onSetActive: (id: string | null) => void };

/** One familiar per boss. Owned ones can be brought along for a small bonus; the rest are silhouettes. */
export function FamiliarsCard({ owned, active, onSetActive }: Props) {
  const { c } = useTheme();
  return (
    <Card style={{ gap: space.m }}>
      <Text variant="heading" accessibilityRole="header">Familiars</Text>
      {owned.length === 0 && <Text color="textMuted">Beat bosses for a chance at a familiar.</Text>}
      {REGIONS.map((r) => {
        const f = r.boss.familiar;
        const has = owned.includes(f.id);
        const isActive = active === f.id;
        const bonus = `+${f.bonus.pct}% ${f.bonus.kind === 'exp' ? 'EXP' : 'gold'}`;
        return (
          <Pressable
            key={f.id}
            disabled={!has}
            accessibilityRole="button"
            accessibilityLabel={has ? (isActive ? `${f.name}, with you. Leave at home` : `Bring ${f.name} along`) : `Unknown familiar from ${r.boss.name}`}
            accessibilityState={{ selected: isActive, disabled: !has }}
            onPress={() => onSetActive(isActive ? null : f.id)}
            style={({ pressed }) => ({
              minHeight: minTouch + 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.m,
              padding: space.m,
              borderRadius: radius.button,
              borderWidth: isActive ? 2 : 1,
              borderColor: isActive ? c.primary : c.line,
              backgroundColor: has ? c.surface : c.surfaceSunk,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: has ? c.primary : c.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="bodyStrong" color={has ? 'onPrimary' : 'textMuted'}>{has ? f.name[0] : '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{has ? f.name : '???'}</Text>
              <Text variant="caption" color="textMuted">{has ? `${bonus}${isActive ? ' · with you' : ''}` : `Dropped by ${r.boss.name}`}</Text>
            </View>
          </Pressable>
        );
      })}
    </Card>
  );
}
