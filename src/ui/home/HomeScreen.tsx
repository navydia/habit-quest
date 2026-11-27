import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useMinuteClock } from '../useMinuteClock';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayKey } from '@/src/game/dates';
import { canStartQuest, gaugeProgress } from '@/src/game/gauge';
import { powerOf } from '@/src/game/stats';
import { ensurePermission } from '@/src/notify/questNotifications';
import { useGameStore } from '@/src/store/gameStore';
import { hud, radius, space } from '@/src/theme/tokens';
import { useReducedMotion, useTheme } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Text } from '../kit/Text';
import { AddHabitSheet } from './AddHabitSheet';
import { HabitList } from './HabitList';
import { HeroSprite } from '../hero/HeroSprite';
import { Slime } from './Slime';
import { HomeScene } from './HomeScene';
import { QuestBoardSheet } from './QuestBoardSheet';
import { QuestStatus } from './QuestStatus';
import { DebugSheet } from './DebugSheet';
import { MapSheet } from '../world/MapSheet';
import { ScrapbookSheet } from '../world/ScrapbookSheet';
import { BossHabitSheet } from '../world/BossHabitSheet';
import { bossTokens } from '@/src/game/bosses';
import { currentRegion } from '@/src/game/world';
import { familiarById } from '@/src/content/regions';
import { ReturnReveal } from './ReturnReveal';

export function HomeScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const now = useMinuteClock();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const save = useGameStore((s) => s.save);
  const { toggleHabit, addHabit, ensureBoard, startQuest, collect, skipAdventure, travel, setBossHabit, debug } = useGameStore.getState();
  const [adding, setAdding] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [scrapbook, setScrapbook] = useState<string | null>(null);
  const [bossSheet, setBossSheet] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const region = currentRegion(save);

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
            <Chip text={`${powerOf(save.player)} power`} />
          </View>
          <View style={[styles.hudRow2, { top: insets.top + space.s + 36 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Map: ${region.name}`} hitSlop={6} onPress={() => setMapOpen(true)} style={({ pressed }) => [styles.chip, styles.tapChip, { opacity: pressed ? 0.75 : 1 }]}>
              <Text variant="label" style={{ color: hud.text }}>⌖ {region.name}</Text>
            </Pressable>
            {__DEV__ && (
              <Pressable accessibilityRole="button" accessibilityLabel="Debug menu" hitSlop={6} onPress={() => setDebugOpen(true)} style={({ pressed }) => [styles.chip, styles.tapChip, { opacity: pressed ? 0.75 : 1 }]}>
                <Text variant="label" style={{ color: hud.text }}>Debug</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.heroWrap}>
            {mode === 'questing' && <Slime reduced={reduced} />}
            {save.familiars.active && <FamiliarBuddy id={save.familiars.active} />}
            <HeroSprite
              player={save.player}
              anim={mode === 'questing' ? 'fight' : 'idle'}
              height={210}
              paused={!focused}
              accessibilityLabel={mode === 'idle' ? 'Your hero, resting at home' : 'Your hero, out on an adventure'}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ marginTop: -36 }}>
            <QuestStatus
              save={save}
              gauge={gauge}
              canStart={canStart}
              startedToday={save.lastQuestStartedDayKey === today}
              now={now}
              onSkip={__DEV__ ? () => skipAdventure(new Date()) : undefined}
              onBossHabit={() => setBossSheet(true)}
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
        onStart={(id, boss) => {
          setChoosing(false);
          // Ask first, so the return notification is allowed when it gets scheduled.
          ensurePermission()
            .catch(() => false)
            .then(() => startQuest(id, new Date(), boss));
        }}
      />
      <MapSheet
        visible={mapOpen}
        save={save}
        now={now}
        onClose={() => setMapOpen(false)}
        onTravel={(id) => {
          travel(id, new Date());
          setMapOpen(false);
        }}
        onScrapbook={(id) => {
          setMapOpen(false);
          setScrapbook(id);
        }}
      />
      <ScrapbookSheet regionId={scrapbook} save={save} onClose={() => setScrapbook(null)} />
      <BossHabitSheet
        visible={bossSheet}
        habits={save.habits}
        currentId={save.boss.habitId}
        tokens={bossTokens(save)}
        onClose={() => setBossSheet(false)}
        onChoose={(id) => setBossHabit(id, new Date())}
      />
      {__DEV__ && (
        <DebugSheet
          visible={debugOpen}
          onClose={() => setDebugOpen(false)}
          onAction={(a) => {
            if (a === 'skip') skipAdventure(new Date());
            else debug(a, new Date());
            setDebugOpen(false);
          }}
        />
      )}
      <ReturnReveal
        result={save.pendingResult}
        player={save.player}
        onCollect={(equipDrop) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          collect(equipDrop);
        }}
      />
    </View>
  );
}

/** Placeholder familiar sitting beside the hero (art comes later). */
function FamiliarBuddy({ id }: { id: string }) {
  const f = familiarById(id);
  if (!f) return null;
  return (
    <View accessible accessibilityLabel={`${f.name}, your familiar`} style={styles.buddy}>
      <View style={styles.buddyEyes}>
        <View style={styles.eye} />
        <View style={styles.eye} />
      </View>
    </View>
  );
}

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text variant="label" style={{ color: hud.text }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 44, overflow: 'hidden' },
  heroWrap: { width: 250, alignItems: 'center', justifyContent: 'flex-end' },
  hud: { position: 'absolute', left: space.screen, right: space.screen, flexDirection: 'row', gap: space.s },
  buddy: { position: 'absolute', left: 10, bottom: 14, width: 42, height: 36, borderTopLeftRadius: 21, borderTopRightRadius: 21, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: '#C79A5B', alignItems: 'center', justifyContent: 'center' },
  buddyEyes: { flexDirection: 'row', gap: 8, marginTop: -2 },
  eye: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2A2623' },
  hudRow2: { position: 'absolute', left: space.screen, right: space.screen, flexDirection: 'row', gap: space.s },
  tapChip: { minHeight: 32, justifyContent: 'center' },
  chip: { backgroundColor: hud.bg, borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: space.xs },
  body: { paddingHorizontal: space.screen, gap: space.xxl },
});
