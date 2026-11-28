import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { initialWindowMetrics, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { pickInsets } from '@/src/ui/useSafeInsets';
import { ModalRoot } from '../kit/ModalRoot';
import { availableBosses, bossChance, bossRequiredPower } from '@/src/game/bosses';
import { BOSS_DEFENSE_PER_POINT } from '@/src/game/config';
import { powerOf, totalStats } from '@/src/game/stats';
import type { BossDifficulty, SaveData } from '@/src/game/types';
import { minTouch, radius, space } from '@/src/theme/tokens';
import { useReducedMotion, useTheme } from '@/src/theme/useTheme';
import { BossFigure } from '../home/BossFigure';
import { Button } from '../kit/Button';
import { Text } from '../kit/Text';

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

const DIFFS: { d: BossDifficulty; label: string; note: string }[] = [
  { d: 'normal', label: 'Normal', note: 'Always a win. Standard rewards.' },
  { d: 'hard', label: 'Hard', note: '×1.75 rewards, ×2 familiar chance.' },
  { d: 'extreme', label: 'Extreme', note: '×3 rewards, ×4 familiar chance.' },
];

type Props = {
  visible: boolean;
  save: SaveData;
  onClose: () => void;
  onFight: (bossId: string, difficulty: BossDifficulty) => void;
  onAdventureInstead: () => void;
};

/** Boss preview: the boss large on a backdrop coloured by risk, small difficulty buttons beneath. */
export function BossSheet({ visible, save, onClose, onFight, onAdventureInstead }: Props) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const bosses = availableBosses(save);
  const [index, setIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<BossDifficulty>('normal');
  const boss = bosses[Math.min(index, bosses.length - 1)];
  // Only mounted while open (see Sheet): closing unmounts the Modal.
  if (!visible || !boss) return null;

  const chance = bossChance(save.player, boss, difficulty);
  const yourPower = powerOf(save.player) + BOSS_DEFENSE_PER_POINT * totalStats(save.player).defense;
  // Colour shows the risk: moss = safe, gold = a gamble, ember = a long shot.
  const tone = chance >= 1 ? c.primary : chance >= 0.5 ? c.accent : c.ember;
  const toneText = chance >= 1 ? 'onPrimary' : chance >= 0.5 ? 'onAccent' : 'onEmber';
  // Darker gold for text on cream, so it meets contrast.
  const toneOnPage = chance >= 1 ? c.primary : chance >= 0.5 ? c.accentLip : c.ember;
  const label = DIFFS.find((x) => x.d === difficulty)!;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <ModalRoot>
        <SafeAreaInsetsContext.Consumer>
          {(measured) => {
            // Insets measured inside the Modal's own window (see ModalRoot).
            const insets = pickInsets(measured ?? NO_INSETS, initialWindowMetrics?.insets ?? null, Platform.OS);
            return (
              <View style={{ flex: 1, backgroundColor: c.bg }}>
                <ScrollView
                  contentContainerStyle={{
                    paddingBottom: insets.bottom + space.xl,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: tone,
                      paddingTop: insets.top + space.m,
                      paddingBottom: space.xl,
                      borderBottomLeftRadius: radius.sheet,
                      borderBottomRightRadius: radius.sheet,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: space.screen,
                      }}
                    >
                      <Text variant="label" color={toneText}>
                        Boss fight
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        onPress={onClose}
                        style={{
                          minWidth: minTouch,
                          minHeight: minTouch,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text variant="title" color={toneText}>
                          ×
                        </Text>
                      </Pressable>
                    </View>
                    <BossFigure bossId={boss.id} name={boss.name} reduced={reduced} inline size={190} />
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: space.m,
                        paddingHorizontal: space.screen,
                      }}
                    >
                      {bosses.length > 1 && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Previous boss"
                          onPress={() => setIndex((i) => (i - 1 + bosses.length) % bosses.length)}
                          style={{
                            minWidth: minTouch,
                            minHeight: minTouch,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text variant="title" color={toneText}>
                            ‹
                          </Text>
                        </Pressable>
                      )}
                      <Text variant="title" color={toneText} style={{ textAlign: 'center', flexShrink: 1 }}>
                        {boss.name}
                      </Text>
                      {bosses.length > 1 && (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Next boss"
                          onPress={() => setIndex((i) => (i + 1) % bosses.length)}
                          style={{
                            minWidth: minTouch,
                            minHeight: minTouch,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text variant="title" color={toneText}>
                            ›
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    <Text
                      color={toneText}
                      style={{
                        textAlign: 'center',
                        paddingHorizontal: space.xxl,
                      }}
                    >
                      {boss.flavour}
                    </Text>
                  </View>

                  <View style={{ padding: space.screen, gap: space.l }}>
                    <View style={{ flexDirection: 'row', gap: space.s }} accessibilityRole="radiogroup" accessibilityLabel="Difficulty">
                      {DIFFS.map((x) => {
                        const sel = x.d === difficulty;
                        const ch = bossChance(save.player, boss, x.d);
                        return (
                          <Pressable
                            key={x.d}
                            accessibilityRole="radio"
                            accessibilityLabel={`${x.label}, ${Math.round(ch * 100)}%`}
                            accessibilityState={{ checked: sel }}
                            onPress={() => setDifficulty(x.d)}
                            style={({ pressed }) => ({
                              flex: 1,
                              minHeight: minTouch,
                              borderRadius: radius.chip,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: sel ? tone : c.surface,
                              borderWidth: 1,
                              borderColor: sel ? tone : c.line,
                              opacity: pressed ? 0.85 : 1,
                            })}
                          >
                            <Text variant="bodyStrong" color={sel ? toneText : 'text'}>
                              {x.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={{ alignItems: 'center', gap: 2 }} accessibilityLiveRegion="polite">
                      <Text variant="display" style={{ color: toneOnPage }}>
                        {Math.round(chance * 100)}%
                      </Text>
                      <Text variant="label" color="textMuted">
                        chance of victory
                      </Text>
                      <Text color="textMuted" style={{ textAlign: 'center' }}>
                        Requires {bossRequiredPower(boss, difficulty)} power · You have {yourPower}
                        {difficulty === 'normal' ? '' : ' (Defense adds 2 each)'}
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {label.note} Losing spends your 6 tokens.
                      </Text>
                    </View>
                    <Button title={`Fight ${boss.name} (${label.label})`} variant="reward" onPress={() => onFight(boss.id, difficulty)} />
                    <Pressable
                      accessibilityRole="button"
                      onPress={onAdventureInstead}
                      style={{
                        minHeight: minTouch,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text variant="bodyStrong" color="primary">
                        Go adventuring instead (keep your tokens)
                      </Text>
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            );
          }}
        </SafeAreaInsetsContext.Consumer>
      </ModalRoot>
    </Modal>
  );
}
