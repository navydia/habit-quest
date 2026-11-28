import { clockNow } from '@/src/game/clock';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { initialWindowMetrics, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { pickInsets } from '@/src/ui/useSafeInsets';
import { ModalRoot } from '../kit/ModalRoot';
import { EMOJI_CHOICES, LIFE_AREAS, TIMES_OF_DAY, lifeAreaColor } from '@/src/content/habitOptions';
import { dayKey } from '@/src/game/dates';
import type { Habit, LifeArea, Schedule, TimeOfDay, Weekday } from '@/src/game/types';
import type { HabitDetails } from '@/src/store/gameStore';
import { minTouch, radius, space , topTapGuard } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Text } from '../kit/Text';

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

const DAYS: { d: Weekday; label: string; name: string }[] = [
  { d: 1, label: 'M', name: 'Monday' },
  { d: 2, label: 'T', name: 'Tuesday' },
  { d: 3, label: 'W', name: 'Wednesday' },
  { d: 4, label: 'T', name: 'Thursday' },
  { d: 5, label: 'F', name: 'Friday' },
  { d: 6, label: 'S', name: 'Saturday' },
  { d: 0, label: 'S', name: 'Sunday' },
];

type Repeat = 'daily' | 'weekdays' | 'interval';
type Props = {
  visible: boolean;
  /** Edit this habit; add a new one when null. */
  habit: Habit | null;
  onClose: () => void;
  onSave: (details: HabitDetails) => void;
  onArchive?: (id: string) => void;
  /** Boss tokens to warn about when archiving the boss habit. */
  bossTokens?: number;
  isBossHabit?: boolean;
  /** Starting section for a new habit (from a section's + button). */
  preset?: { timeOfDay?: TimeOfDay; lifeArea?: LifeArea };
};

export function HabitSheet({ visible, habit, onClose, onSave, onArchive, bossTokens = 0, isBossHabit = false, preset = {} }: Props) {
  const { c, t } = useTheme();
  // Mounted fresh each time it opens (see HomeScreen), so state starts from the habit being edited.
  const start = habit?.schedule ?? { kind: 'daily' as const };
  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '✨');
  const [lifeArea, setLifeArea] = useState<LifeArea>(habit?.lifeArea ?? preset.lifeArea ?? 'other');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(habit?.timeOfDay ?? preset.timeOfDay ?? 'anytime');
  const [repeat, setRepeat] = useState<Repeat>(start.kind);
  const [days, setDays] = useState<Weekday[]>(start.kind === 'weekdays' ? start.days : [1, 2, 3, 4, 5]);
  const [every, setEvery] = useState(start.kind === 'interval' ? start.every : 2);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [open, setOpen] = useState<'emoji' | 'area' | 'time' | 'repeat' | null>(null);

  // An every-N-days repeat counts from the day it is set, unless it is unchanged.
  const from = start.kind === 'interval' && start.every === every && start.from ? start.from : dayKey(clockNow());
  const schedule: Schedule =
    repeat === 'daily'
      ? { kind: 'daily' }
      : repeat === 'weekdays'
        ? { kind: 'weekdays', days: [...days].sort() }
        : { kind: 'interval', every, from };
  const valid = name.trim().length > 0 && (repeat !== 'weekdays' || days.length > 0);
  const submit = () => {
    if (!valid) return;
    onSave({
      name,
      emoji: emoji.trim() || '✨',
      lifeArea,
      timeOfDay,
      schedule,
    });
    close();
  };

  const chip = (label: string, selected: boolean, onPress: () => void, a11y = label) => (
    <Pressable
      key={a11y}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: minTouch,
        minWidth: minTouch,
        paddingHorizontal: space.m,
        borderRadius: radius.chip,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? c.primary : c.surface,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text variant="bodyStrong" color={selected ? 'onPrimary' : 'text'}>
        {label}
      </Text>
    </Pressable>
  );
  const wrap = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: space.s,
  };

  // Dismiss the keyboard before closing so iOS can animate the page away cleanly.
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const row = (key: 'area' | 'time' | 'repeat', label: string, value: string, icon: string, body: React.ReactNode) => (
    <View
      style={{
        backgroundColor: c.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: c.line,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityState={{ expanded: open === key }}
        onPress={() => setOpen(open === key ? null : key)}
        style={({ pressed }) => ({
          minHeight: minTouch + 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.m,
          paddingHorizontal: space.l,
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Text style={{ fontSize: 22 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text variant="label" color="textMuted">
            {label}
          </Text>
          <Text variant="bodyStrong">{value}</Text>
        </View>
        <Text color="textMuted">{open === key ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open === key && <View style={{ padding: space.l, paddingTop: 0, gap: space.s }}>{body}</View>}
    </View>
  );
  const repeatLabel =
    repeat === 'daily'
      ? 'Every day'
      : repeat === 'weekdays'
        ? `On ${days.length} ${days.length === 1 ? 'day' : 'days'} a week`
        : `Every ${every} days`;

  if (!visible) return null;
  return (
    // A full-screen page, not a sheet: the Add/Save action lives in the header bar, so the keyboard can
    // never hide it (style rule 17a), and nothing has to be squeezed up when the keyboard opens.
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <ModalRoot>
        <SafeAreaInsetsContext.Consumer>
          {(measured) => {
            // Insets measured inside the Modal's own window (see ModalRoot).
            const insets = pickInsets(measured ?? NO_INSETS, initialWindowMetrics?.insets ?? null, Platform.OS);
            return (
              <View
                style={{
                  flex: 1,
                  backgroundColor: c.bg,
                  paddingTop: insets.top + topTapGuard,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: space.s,
                    minHeight: 52,
                    borderBottomWidth: 1,
                    borderBottomColor: c.line,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={close}
                    style={{
                      minWidth: 72,
                      minHeight: minTouch,
                      justifyContent: 'center',
                      paddingHorizontal: space.m,
                    }}
                  >
                    <Text variant="bodyStrong" color="textMuted">
                      Cancel
                    </Text>
                  </Pressable>
                  <Text variant="heading" accessibilityRole="header">
                    {habit ? 'Edit habit' : 'New habit'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={habit ? 'Save changes' : 'Add habit'}
                    accessibilityState={{ disabled: !valid }}
                    disabled={!valid}
                    onPress={submit}
                    style={({ pressed }) => ({
                      minWidth: 72,
                      minHeight: minTouch,
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      paddingHorizontal: space.m,
                      opacity: !valid ? 0.4 : pressed ? 0.6 : 1,
                    })}
                  >
                    <Text variant="bodyStrong" color="primary">
                      {habit ? 'Save' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                      padding: space.screen,
                      paddingBottom: insets.bottom + space.xxl,
                    }}
                  >
                    <View style={{ gap: space.m }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space.l,
                        }}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Emoji ${emoji}. Change`}
                          onPress={() => setOpen(open === 'emoji' ? null : 'emoji')}
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: 28,
                            backgroundColor: lifeAreaColor(lifeArea),
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: [{ rotate: '-4deg' }],
                          }}
                        >
                          <Text style={{ fontSize: 44, lineHeight: 52 }}>{emoji}</Text>
                        </Pressable>
                        <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                          Tap the picture to pick an emoji.
                        </Text>
                      </View>
                      {open === 'emoji' && (
                        <View style={{ gap: space.s }}>
                          <View style={wrap}>{EMOJI_CHOICES.map((e) => chip(e, emoji === e, () => setEmoji(e), `Emoji ${e}`))}</View>
                          <TextInput
                            value={emoji}
                            onChangeText={(v) => setEmoji([...v].slice(-2).join(''))}
                            accessibilityLabel="Type an emoji"
                            style={[
                              t.title,
                              {
                                width: 72,
                                textAlign: 'center',
                                color: c.text,
                                backgroundColor: c.surface,
                                borderColor: c.line,
                                borderWidth: 1,
                                borderRadius: radius.button,
                                minHeight: minTouch + 8,
                              },
                            ]}
                          />
                        </View>
                      )}
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Read for 20 minutes"
                        placeholderTextColor={c.textMuted}
                        accessibilityLabel="Habit name"
                        returnKeyType="done"
                        onSubmitEditing={submit}
                        style={[
                          t.heading,
                          {
                            color: c.text,
                            backgroundColor: c.surface,
                            borderColor: c.line,
                            borderWidth: 1,
                            borderRadius: radius.card,
                            paddingHorizontal: space.l,
                            minHeight: minTouch + 24,
                          },
                        ]}
                      />
                      {row(
                        'area',
                        'Life area',
                        `${LIFE_AREAS.find((a) => a.id === lifeArea)?.emoji} ${LIFE_AREAS.find((a) => a.id === lifeArea)?.label}`,
                        '🧭',
                        <View style={wrap}>
                          {LIFE_AREAS.map((a) => chip(`${a.emoji} ${a.label}`, lifeArea === a.id, () => setLifeArea(a.id), a.label))}
                        </View>,
                      )}
                      {row(
                        'time',
                        'Time of day',
                        TIMES_OF_DAY.find((x) => x.id === timeOfDay)?.label ?? '',
                        '🕒',
                        <View style={wrap}>{TIMES_OF_DAY.map((x) => chip(x.label, timeOfDay === x.id, () => setTimeOfDay(x.id)))}</View>,
                      )}
                      {row(
                        'repeat',
                        'Repeat',
                        repeatLabel,
                        '🔁',
                        <>
                          <View style={wrap}>
                            {chip('Every day', repeat === 'daily', () => setRepeat('daily'))}
                            {chip('Some days', repeat === 'weekdays', () => setRepeat('weekdays'))}
                            {chip('Every few days', repeat === 'interval', () => setRepeat('interval'))}
                          </View>
                          {repeat === 'weekdays' && (
                            <View style={wrap}>
                              {DAYS.map(({ d, label, name: full }) =>
                                chip(
                                  label,
                                  days.includes(d),
                                  () => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d])),
                                  full,
                                ),
                              )}
                            </View>
                          )}
                          {repeat === 'interval' && (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: space.m,
                              }}
                            >
                              {chip('−', false, () => setEvery((n) => Math.max(2, n - 1)), 'Fewer days')}
                              <Text variant="bodyStrong" accessibilityLiveRegion="polite">
                                Every {every} days
                              </Text>
                              {chip('+', false, () => setEvery((n) => Math.min(30, n + 1)), 'More days')}
                            </View>
                          )}
                        </>,
                      )}
                      {habit && onArchive && (
                        <View style={{ marginTop: space.m, gap: space.s }}>
                          {confirmArchive && isBossHabit && (
                            <Text color="ember">This is your boss habit. Archiving it resets your {bossTokens} boss tokens.</Text>
                          )}
                          <Button
                            title={confirmArchive ? 'Tap again to archive' : 'Archive habit'}
                            variant="secondary"
                            onPress={() => {
                              if (!confirmArchive) return setConfirmArchive(true);
                              onArchive(habit.id);
                              close();
                            }}
                          />
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              </View>
            );
          }}
        </SafeAreaInsetsContext.Consumer>
      </ModalRoot>
    </Modal>
  );
}
