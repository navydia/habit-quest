import { View } from 'react-native';
import { gearById, RARITY_LABEL } from '@/src/content/gear';
import { SLOT_INFO } from '@/src/content/slots';
import type { Player, Slot } from '@/src/game/types';
import { rarity as rarityColors, space } from '@/src/theme/tokens';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { TactileCard } from '../kit/TactileCard';
import { Text } from '../kit/Text';
import { statLine } from './gearText';

type Props = { slot: Slot | null; player: Player; onClose: () => void; onEquip: (uid: string) => void; onUnequip: (slot: Slot) => void };

/** One equipment slot: what's on now (with stats) and everything you own that fits. */
export function SlotSheet({ slot, player, onClose, onEquip, onUnequip }: Props) {
  const owned = slot ? player.inventory.filter((i) => gearById(i.gearId)?.slot === slot || player.equipped[slot] === i.uid) : [];
  return (
    <Sheet visible={!!slot} title={slot ? SLOT_INFO[slot].name : ''} onClose={onClose}>
      <View style={{ gap: space.m }}>
        {owned.length === 0 && <Text color="textMuted">Nothing for this slot yet. Adventures, bosses and the Shop all have gear.</Text>}
        {owned.map((item) => {
          const def = gearById(item.gearId);
          const equipped = slot ? player.equipped[slot] === item.uid : false;
          return (
            <TactileCard key={item.uid} accent={def ? rarityColors[def.rarity] : undefined}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyStrong">{def?.name ?? 'Unknown item'}</Text>
                <Text variant="caption" color="textMuted">{def ? RARITY_LABEL[def.rarity] : ''}{equipped ? ' · Equipped' : ''}</Text>
              </View>
              {def && <Text variant="caption" color="textMuted">{statLine(def)}</Text>}
              {equipped ? (
                <Button title="Take off" variant="secondary" onPress={() => slot && onUnequip(slot)} />
              ) : (
                <Button title={`Equip ${def?.name ?? 'item'}`} onPress={() => onEquip(item.uid)} disabled={!def} />
              )}
            </TactileCard>
          );
        })}
      </View>
    </Sheet>
  );
}
