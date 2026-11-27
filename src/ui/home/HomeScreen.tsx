import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useMinuteClock } from '../useMinuteClock';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayKey } from '@/src/game/dates';
import { canStartQuest, gaugeProgress } from '@/src/game/gauge';
import { powerRating } from '@/src/game/progression';
import { ensurePermission } from '@/src/notify/questNotifications';
import { useGameStore } from '@/src/store/gameStore';
import { radius, space } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Text } from '../kit/Text';
import { AddHabitSheet } from './AddHabitSheet';
import { HabitList } from './HabitList';
import { HeroPlaceholder } from './HeroPlaceholder';
import { HomeScene } from './HomeScene';
import { QuestBoardSheet } from './QuestBoardSheet';
import { QuestStatus } from './QuestStatus';
import { ReturnReveal } from './ReturnReveal';

export function HomeScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const now = useMinuteClock();
  const save = useGameStore((s) => s.save);
  const { toggleHabit, addHabit, ensureBoard, startQuest, collect } = useGameStore.getState();
  const [adding, setAdding] = useState(false);
  const [choosing, setChoosing] = useState(false);

  const today = dayKey(now);
  const gauge = gaugeProgress(save, today);
  const canStart = canStartQuest(save, now);
  const mode = save.activeRun ? 'questing' : 'idle';

  const wasFull = useRef(gauge.full);
  useEffect(() => {
    if (gauge.full && !wasFull.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    wasFull.current = gauge.full;
  }, [gauge.full]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <View style={[styles.stage, { height: Math.max(300, height * 0.45) }]}>
          <HomeScene mode={mode} />
          <View style={[styles.hud, { top: insets.top + space.s }]}>
            <Chip text={`Lv ${save.player.level}`} />
            <Chip text={`${save.player.gold} gold`} />
            <Chip text={`${powerRating(save.player.level)} power`} />
          </View>
          <HeroPlaceholder mode={mode} />
        </View>

        <View style={styles.body}>
          <View style={{ marginTop: -36 }}>
            <QuestStatus
              save={save}
              gauge={gauge}
              canStart={canStart}
              startedToday={save.lastQuestStartedDayKey === today}
              now={now}
              onChoose={() => {
                ensureBoard(new Date());
                setChoosing(true);
              }}
            />
          </View>
          <HabitList save={save} today={today} onToggle={(id, key) => toggleHabit(id, key, new Date())} />
          <Button title="+ Add habit" variant="secondary" onPress={() => setAdding(true)} />
        </View>
      </ScrollView>

      <AddHabitSheet visible={adding} onClose={() => setAdding(false)} onAdd={(name, schedule) => addHabit(name, schedule)} />
      <QuestBoardSheet
        visible={choosing}
        save={save}
        onClose={() => setChoosing(false)}
        onStart={(id) => {
          setChoosing(false);
          // Ask first, so the return notification is allowed when it gets scheduled.
          ensurePermission()
            .catch(() => false)
            .then(() => startQuest(id, new Date()));
        }}
      />
      <ReturnReveal
        result={save.pendingResult}
        player={save.player}
        onCollect={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          collect();
        }}
      />
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="label" style={{ color: '#FFF8EC' }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 44, overflow: 'hidden' },
  hud: { position: 'absolute', left: space.screen, right: space.screen, flexDirection: 'row', gap: space.s },
  chip: { backgroundColor: 'rgba(28,24,22,0.55)', borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: space.xs },
  body: { paddingHorizontal: space.screen, gap: space.xxl },
});
