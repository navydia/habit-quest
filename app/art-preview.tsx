import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeInsets } from '@/src/ui/useSafeInsets';
import type { Anim } from '@/src/art/types';
import { GEAR, RARITY_LABEL } from '@/src/content/gear';
import type { Player, Slot } from '@/src/game/types';
import { newSave } from '@/src/save/migrate';
import { useGameStore } from '@/src/store/gameStore';
import { radius, rarity, scene, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { HeroSprite } from '@/src/ui/hero/HeroSprite';
import { Text } from '@/src/ui/kit/Text';

const SLOTS: Slot[] = ['weapon', 'head', 'body', 'feet', 'accessory'];

/** Testing screen: try any gear combination to check that art lines up. */
export default function ArtPreview() {
  const { c } = useTheme();
  const insets = useSafeInsets();
  const profile = useGameStore((st) => st.save.profile);
  const [equipped, setEquipped] = useState<Partial<Record<Slot, string>>>({ weapon: 'wooden-sword', body: 'travellers-tunic' });
  const player: Player = {
    ...newSave().player,
    inventory: GEAR.map((g) => ({ uid: g.id, gearId: g.id, obtainedAt: '' })),
    equipped,
  };
  const toggle = (slot: Slot, id: string) => setEquipped((e) => ({ ...e, [slot]: e[slot] === id ? undefined : id }));

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.screen, paddingTop: insets.top + space.l, gap: space.l }}>
      <Text variant="title" accessibilityRole="header">Art preview</Text>
      <View style={{ flexDirection: 'row', gap: space.m }}>
        {(['idle', 'fight'] as Anim[]).map((anim) => (
          <View key={anim} style={{ flex: 1, alignItems: 'center', backgroundColor: scene.skyBottom, borderRadius: radius.card, paddingTop: space.m }}>
            <HeroSprite player={player} anim={anim} height={180} appearance={{ look: profile.look, pronouns: profile.pronouns }} />
            <Text variant="label" style={{ color: '#FFF8EC', marginBottom: space.s }}>{anim}</Text>
          </View>
        ))}
      </View>
      {SLOTS.map((slot) => (
        <View key={slot} style={{ gap: space.s }}>
          <Text variant="label" color="textMuted">{slot}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
            {GEAR.filter((g) => g.slot === slot).map((g) => (
              <Pressable
                key={g.id}
                accessibilityRole="button"
                accessibilityState={{ selected: equipped[slot] === g.id }}
                onPress={() => toggle(slot, g.id)}
                style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space.m, borderRadius: radius.chip, borderWidth: 2, borderColor: equipped[slot] === g.id ? rarity[g.rarity] : c.line, backgroundColor: c.surface }}
              >
                <Text variant="caption">{g.name} · {RARITY_LABEL[g.rarity]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
