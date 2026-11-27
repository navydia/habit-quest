import { View } from 'react-native';
import { familiarById } from '@/src/content/regions';
import { space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { TactileCard } from '../kit/TactileCard';
import { Text } from '../kit/Text';

type Props = { visible: boolean; owned: string[]; active: string | null; onClose: () => void; onSetActive: (id: string | null) => void };

export const familiarBonusText = (id: string) => {
  const f = familiarById(id);
  return f ? `+${f.bonus.pct}% ${f.bonus.kind === 'exp' ? 'EXP' : 'gold'}` : '';
};

/** The familiar slot: choose which familiar comes along. */
export function FamiliarSheet({ visible, owned, active, onClose, onSetActive }: Props) {
  const { c } = useTheme();
  return (
    <Sheet visible={visible} title="Familiar" onClose={onClose}>
      <View style={{ gap: space.m }}>
        {owned.length === 0 && <Text color="textMuted">Beat bosses for a chance at a familiar. Your full collection is in the Log.</Text>}
        {owned.map((id) => {
          const f = familiarById(id);
          if (!f) return null;
          const on = active === id;
          return (
            <TactileCard key={id} accent={on ? c.primary : undefined}>
              <Text variant="bodyStrong">{f.name}{on ? ' · With you' : ''}</Text>
              <Text variant="caption" color="textMuted">{familiarBonusText(id)} · {f.description}</Text>
              <Button title={on ? 'Leave at home' : `Bring ${f.name} along`} variant={on ? 'secondary' : 'primary'} onPress={() => onSetActive(on ? null : id)} />
            </TactileCard>
          );
        })}
      </View>
    </Sheet>
  );
}
