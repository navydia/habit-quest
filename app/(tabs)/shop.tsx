import { clockNow } from '@/src/game/clock';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gearById, RARITY_LABEL } from '@/src/content/gear';
import { POTIONS, potionById } from '@/src/content/shop';
import { SLOT_INFO } from '@/src/content/slots';
import { dayKey } from '@/src/game/dates';
import { armoryStock, premiumItem, type StockItem } from '@/src/game/shop';
import { useGameStore } from '@/src/store/gameStore';
import { minTouch, radius, rarity as rarityColors, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { statLine } from '@/src/ui/character/gearText';
import { Button } from '@/src/ui/kit/Button';
import { TactileCard } from '@/src/ui/kit/TactileCard';
import { Text } from '@/src/ui/kit/Text';
import { useMinuteClock } from '@/src/ui/useMinuteClock';

type Tab = 'armory' | 'apothecary' | 'cosmetics' | 'housing';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'armory', label: 'Armory', emoji: '⚔️' },
  { id: 'apothecary', label: 'Apothecary', emoji: '🧪' },
  { id: 'cosmetics', label: 'Cosmetics', emoji: '🎀' },
  { id: 'housing', label: 'Housing', emoji: '🏡' },
];

/** The Shop: each shop is its own tab. */
export default function ShopScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useMinuteClock();
  const save = useGameStore((s) => s.save);
  const { buyGear, buyPotion, drinkPotion } = useGameStore.getState();
  const [tab, setTab] = useState<Tab>('armory');
  const [message, setMessage] = useState<string | null>(null);
  const today = dayKey(now);
  const bought = save.shop.dayKey === today ? save.shop.bought : [];

  const say = (err: string | undefined, ok: string) => setMessage(err ?? ok);

  const gearCard = (item: StockItem, special = false) => {
    const def = gearById(item.gearId);
    if (!def) return null;
    const sold = bought.includes(item.slotId) || (special && save.player.inventory.some((i) => i.obtainedAt === item.slotId));
    return (
      <View key={item.slotId} style={{ flexBasis: special ? '100%' : '47%', flexGrow: 1 }}>
        <TactileCard accent={rarityColors[def.rarity]}>
          {special && <Text variant="label" style={{ color: c.accentLip }}>★ This week&rsquo;s special</Text>}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: rarityColors[def.rarity], alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] }}>
              <Text style={{ fontSize: 24, lineHeight: 30 }}>{SLOT_INFO[def.slot].emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={2}>{def.name}</Text>
              <Text variant="caption" color="textMuted">{RARITY_LABEL[def.rarity]} · {SLOT_INFO[def.slot].name}</Text>
            </View>
          </View>
          <Text variant="caption" color="textMuted">{statLine(def)}</Text>
          <Button
            title={sold ? 'Sold out' : `Buy · ${item.price} gold`}
            variant={sold ? 'secondary' : 'primary'}
            disabled={sold}
            onPress={() => say(buyGear(item.slotId, clockNow()), `${def.name} is yours. Find it on the Character tab.`)}
          />
        </TactileCard>
      </View>
    );
  };

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: space.screen, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + 96, gap: space.l }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="display" accessibilityRole="header">Shop</Text>
        <View style={{ backgroundColor: c.accent, borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: space.xs }}>
          <Text variant="bodyStrong" color="onAccent">{save.player.gold} gold</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.s }} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            accessibilityLabel={t.label}
            onPress={() => {
              setTab(t.id);
              setMessage(null);
            }}
            style={({ pressed }) => ({ minHeight: minTouch, paddingHorizontal: space.l, borderRadius: radius.chip, justifyContent: 'center', backgroundColor: tab === t.id ? c.primary : c.surface, borderWidth: 1, borderColor: tab === t.id ? c.primary : c.line, opacity: pressed ? 0.85 : 1 })}
          >
            <Text variant="bodyStrong" color={tab === t.id ? 'onPrimary' : 'text'}>{t.emoji} {t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {message && (
        <Text accessibilityLiveRegion="polite" color="textMuted">{message}</Text>
      )}

      {tab === 'armory' && (
        <View style={{ gap: space.l }}>
          {gearCard(premiumItem(today), true)}
          <Text variant="heading" accessibilityRole="header">Today&rsquo;s stock</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>{armoryStock(today).map((i) => gearCard(i))}</View>
          <Text variant="caption" color="textMuted">New stock every day. The special changes every Monday.</Text>
        </View>
      )}

      {tab === 'apothecary' && (
        <View style={{ gap: space.m }}>
          {save.potions.active && (
            <TactileCard accent={c.primary}>
              <Text variant="label" color="primary">Active for your next trip</Text>
              <Text variant="heading">{potionById(save.potions.active)?.emoji} {potionById(save.potions.active)?.name}</Text>
            </TactileCard>
          )}
          {POTIONS.map((p) => {
            const owned = save.potions.owned[p.id] ?? 0;
            return (
              <TactileCard key={p.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
                  <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: c.surfaceSunk, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] }}>
                    <Text style={{ fontSize: 24, lineHeight: 30 }}>{p.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{p.name}</Text>
                    <Text variant="caption" color="textMuted">{p.description}</Text>
                  </View>
                  <Text variant="label" color="textMuted">×{owned}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: space.s }}>
                  <View style={{ flex: 1 }}>
                    <Button title={`Buy · ${p.price} gold`} onPress={() => say(buyPotion(p.id, clockNow()), `Bought a ${p.name}.`)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="Drink" variant="secondary" disabled={owned < 1 || !!save.potions.active} onPress={() => say(drinkPotion(p.id, clockNow()), `${p.name} will help on your next trip.`)} />
                  </View>
                </View>
              </TactileCard>
            );
          })}
        </View>
      )}

      {(tab === 'cosmetics' || tab === 'housing') && (
        <TactileCard>
          <Text variant="heading">{tab === 'cosmetics' ? '🎀 Cosmetics' : '🏡 Housing'}</Text>
          <Text color="textMuted">{tab === 'cosmetics' ? 'Hairstyles, eye colours and more arrive in a later update.' : 'New homes and furniture arrive in a later update.'}</Text>
        </TactileCard>
      )}
    </ScrollView>
  );
}
