import { useState } from 'react';
import { View } from 'react-native';
import type { DebugAction } from '@/src/game/debug';
import { space } from '@/src/theme/tokens';
import { Button } from '../kit/Button';
import { Sheet } from '../kit/Sheet';
import { Text } from '../kit/Text';

const ACTIONS: { action: DebugAction | 'skip'; title: string }[] = [
  { action: 'fillGauge', title: 'Fill adventure gauge' },
  { action: 'skip', title: 'Skip running adventure' },
  { action: 'anotherAdventure', title: 'Allow another adventure today' },
  { action: 'skip1', title: 'Skip 1 hour' },
  { action: 'skip3', title: 'Skip 3 hours' },
  { action: 'skip8', title: 'Skip 8 hours' },
  { action: 'newDay', title: 'Start a new day' },
  { action: 'bossTokens', title: 'Give 6 boss tokens' },
  { action: 'levelUp', title: 'Level up' },
  { action: 'gold', title: 'Add 500 gold' },
  { action: 'allGear', title: 'Give one of every item' },
  { action: 'allFamiliars', title: 'Give every familiar' },
  { action: 'unlockRegions', title: 'Unlock every region' },
];

type Props = { visible: boolean; onClose: () => void; onAction: (a: DebugAction | 'skip') => void };

/** Development builds only (spec §1b): shortcuts for testing every feature. */
export function DebugSheet({ visible, onClose, onAction }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <Sheet visible={visible} title="Debug menu" onClose={onClose}>
      <View style={{ gap: space.s }}>
        <Text variant="caption" color="textMuted">Testing only. Never shown in release builds.</Text>
        {ACTIONS.map((a) => (
          <Button key={a.action} title={a.title} variant="secondary" onPress={() => onAction(a.action)} />
        ))}
        <View style={{ marginTop: space.l }}>
          <Button
            title={confirmReset ? 'Tap again to erase everything' : 'Reset all progress'}
            variant="secondary"
            onPress={() => {
              if (!confirmReset) return setConfirmReset(true);
              setConfirmReset(false);
              onAction('reset');
            }}
          />
        </View>
      </View>
    </Sheet>
  );
}
