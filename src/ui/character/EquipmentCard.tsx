import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { gearById, RARITY_LABEL, type GearDef } from '@/src/content/gear';
import type { Player, Slot } from '@/src/game/types';
import { radius, rarity as rarityColors, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Card } from '../kit/Card';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';
import { statLine } from './gearText';

const SLOTS: { slot: Slot; name: string }[] = [
  { slot: 'weapon', name: 'Weapon' },
  { slot: 'head', name: 'Head' },
  { slot: 'body', name: 'Body' },
  { slot: 'feet', name: 'Feet' },
  { slot: 'accessory', name: 'Accessory' },
];

type Props = { player: Player; onEquip: (uid: string) => void; onUnequip: (slot: Slot) => void };

export function EquipmentCard({ player, onEquip, onUnequip }: Props) {
  const { c } = useTheme();
  const [open, setOpen] = useState<Slot | null>(null);
  const defFor = (uid?: string): GearDef | undefined => (uid ? gearById(player.inventory.find((i) => i.uid === uid)?.gearId ?? '') : undefined);
  const openSlot = SLOTS.find((s) => s.slot === open);
  const owned = open ? player.inventory.filter((i) => gearById(i.gearId)?.slot === open) : [];

  return (
    <Card style={{ gap: space.m }}>
      <Text variant="heading" accessibilityRole="header">Equipment</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
        {SLOTS.map(({ slot, name }) => {
          const def = defFor(player.equipped[slot]);
          return (
            <Pressable
              key={slot}
              accessibilityRole="button"
              accessibilityLabel={`${name}: ${def ? `${def.name}, ${RARITY_LABEL[def.rarity]}` : 'empty'}`}
              onPress={() => setOpen(slot)}
              style={({ pressed }) => ({
                flexBasis: '48%',
                flexGrow: 1,
                minHeight: 72,
                padding: space.m,
                borderRadius: radius.button,
                backgroundColor: c.surfaceSunk,
                borderLeftWidth: 4,
                borderLeftColor: def ? rarityColors[def.rarity] : c.line,
                opacity: pressed ? 0.8 : 1,
                gap: 2,
              })}
            >
              <Text variant="label" color="textMuted">{name}</Text>
              <Text variant="bodyStrong" numberOfLines={1}>{def ? def.name : 'Empty'}</Text>
              {def && <Text variant="caption" color="textMuted">{RARITY_LABEL[def.rarity]}</Text>}
            </Pressable>
          );
        })}
      </View>

      <Sheet visible={!!open} title={openSlot ? `${openSlot.name}` : ''} onClose={() => setOpen(null)}>
        <View style={{ gap: space.m }}>
          {owned.length === 0 && <Text color="textMuted">Nothing here yet. Adventures sometimes bring back gear.</Text>}
          {owned.map((item) => {
            const def = gearById(item.gearId);
            const equipped = open ? player.equipped[open] === item.uid : false;
            return (
              <Card key={item.uid} style={{ gap: space.s, borderLeftWidth: 4, borderLeftColor: def ? rarityColors[def.rarity] : c.line }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="bodyStrong">{def?.name ?? 'Unknown item'}</Text>
                  <Text variant="caption" color="textMuted">{def ? RARITY_LABEL[def.rarity] : ''}</Text>
                </View>
                {def && <Text variant="caption" color="textMuted">{statLine(def)}</Text>}
                {equipped ? (
                  <Button title="Take off" variant="secondary" onPress={() => open && onUnequip(open)} />
                ) : (
                  <Button title={`Equip ${def?.name ?? 'item'}`} onPress={() => onEquip(item.uid)} disabled={!def} />
                )}
              </Card>
            );
          })}
        </View>
      </Sheet>
    </Card>
  );
}
