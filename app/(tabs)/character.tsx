import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { expToNext } from '@/src/game/progression';
import { powerOf } from '@/src/game/stats';
import { useGameStore } from '@/src/store/gameStore';
import { radius, scene, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { EquipmentCard } from '@/src/ui/character/EquipmentCard';
import { StatsCard } from '@/src/ui/character/StatsCard';
import { FamiliarsCard } from '@/src/ui/character/FamiliarsCard';
import { HeroSprite } from '@/src/ui/hero/HeroSprite';
import { Button } from '@/src/ui/kit/Button';
import { Card } from '@/src/ui/kit/Card';
import { ProgressBar } from '@/src/ui/kit/ProgressBar';
import { Text } from '@/src/ui/kit/Text';

export default function CharacterScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const p = useGameStore((s) => s.save.player);
  const familiars = useGameStore((s) => s.save.familiars);
  const { allocateSp, respec, equip, unequip, setActiveFamiliar } = useGameStore.getState();
  const need = expToNext(p.level);

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.screen, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + 96, gap: space.l }}>
      <Card style={{ alignItems: 'center', gap: space.s, paddingTop: space.xl }}>
        <View style={{ backgroundColor: scene.skyBottom, borderRadius: radius.card, alignSelf: 'stretch', alignItems: 'center', paddingTop: space.l }}>
          <HeroSprite player={p} anim="idle" height={190} />
        </View>
        <Text variant="display" accessibilityRole="header">{p.title}</Text>
        <Text color="textMuted">Level {p.level} · {powerOf(p)} power</Text>
        <View style={{ alignSelf: 'stretch', gap: space.xs }}>
          <ProgressBar value={p.exp / need} label="Experience" />
          <Text variant="caption" color="textMuted">{p.exp} / {need} EXP to level {p.level + 1}</Text>
        </View>
      </Card>
      <StatsCard player={p} onAdd={allocateSp} onReset={respec} />
      <EquipmentCard player={p} onEquip={equip} onUnequip={unequip} />
      <FamiliarsCard owned={familiars.owned} active={familiars.active} onSetActive={setActiveFamiliar} />
      {__DEV__ && <Button title="Art preview (testing)" variant="secondary" onPress={() => router.push('/art-preview')} />}
    </ScrollView>
  );
}
