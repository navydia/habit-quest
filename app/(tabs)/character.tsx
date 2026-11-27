import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { expToNext, powerRating } from '@/src/game/progression';
import { useGameStore } from '@/src/store/gameStore';
import { space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Card } from '@/src/ui/kit/Card';
import { ProgressBar } from '@/src/ui/kit/ProgressBar';
import { Text } from '@/src/ui/kit/Text';

export default function CharacterScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useGameStore((s) => s.save.player);
  const need = expToNext(p.level);
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.screen, paddingTop: insets.top + space.xl, gap: space.l }}>
      <Text variant="display" accessibilityRole="header">Adventurer</Text>
      <Card style={{ gap: space.s }}>
        <Text variant="heading">Level {p.level}</Text>
        <ProgressBar value={p.exp / need} label="Experience" />
        <Text variant="caption" color="textMuted">{p.exp} / {need} EXP</Text>
      </Card>
      <Card style={{ gap: space.m }}>
        <Stat label="Power rating" value={powerRating(p.level)} />
        <Stat label="Gold" value={p.gold} />
        <Stat label="Unspent skill points" value={p.unspentSp} />
      </Card>
      <Text color="textMuted">Class, stats and equipment arrive soon.</Text>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}
