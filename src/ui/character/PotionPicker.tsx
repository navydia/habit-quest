import { View } from 'react-native';
import { POTIONS, potionById } from '@/src/content/shop';
import { clockNow } from '@/src/game/clock';
import type { SaveData } from '@/src/game/types';
import { useGameStore } from '@/src/store/gameStore';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Text } from '../kit/Text';

/** The power an already-drunk potion adds to the next trip (for showing chances before setting out). */
export function activePotionPower(save: SaveData): number {
  return save.potions.active ? (potionById(save.potions.active)?.effect.power ?? 0) : 0;
}

/** The trip-time multiplier of an already-drunk potion (1 when none). */
export function activePotionTimeMult(save: SaveData): number {
  return save.potions.active ? (potionById(save.potions.active)?.effect.timeMult ?? 1) : 1;
}

/**
 * The potions you own, each with Drink. Used in the Bag and before adventures and boss fights.
 * `compact` hides the empty-state hint's shop pointer and keeps the list short for the trip sheets.
 */
export function PotionPicker({ save, compact = false }: { save: SaveData; compact?: boolean }) {
  const { c } = useTheme();
  const owned = POTIONS.filter((p) => (save.potions.owned[p.id] ?? 0) > 0);
  const active = save.potions.active ? potionById(save.potions.active) : undefined;
  const drink = (id: string) => useGameStore.getState().drinkPotion(id, clockNow());

  if (compact && !active && owned.length === 0) return null;

  return (
    <View style={{ gap: space.s }}>
      {active && (
        <View style={{ backgroundColor: c.surfaceSunk, borderRadius: radius.card, padding: space.m }}>
          <Text variant="bodyStrong">
            {active.emoji} {active.name} is active
          </Text>
          <Text variant="caption" color="textMuted">
            {active.description}
          </Text>
        </View>
      )}
      {owned.map((p) => (
        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <Text style={{ fontSize: 24, lineHeight: 30 }}>{p.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{p.name}</Text>
            {!compact && (
              <Text variant="caption" color="textMuted">
                {p.description}
              </Text>
            )}
          </View>
          <Text variant="label" color="textMuted">
            ×{save.potions.owned[p.id]}
          </Text>
          <Button
            title="Drink"
            variant="secondary"
            accessibilityLabel={`Drink ${p.name}`}
            disabled={!!active}
            onPress={() => drink(p.id)}
          />
        </View>
      ))}
      {owned.length === 0 && !active && (
        <Text color="textMuted">No potions yet. The Apothecary in the Shop sells them.</Text>
      )}
      {owned.length > 0 && active && (
        <Text variant="caption" color="textMuted">
          One potion at a time. It is used up when your next trip starts.
        </Text>
      )}
    </View>
  );
}
