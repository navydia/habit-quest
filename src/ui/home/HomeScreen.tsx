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
import { home, hud, radius, space } from '@/src/theme/tokens';
import { useReducedMotion } from '@/src/theme/useTheme';
import { Button } from '../kit/Button';
import { Text } from '../kit/Text';
import { HabitSheet } from '../habits/HabitSheet';
import { UndoToast } from './UndoToast';
import { BossSheet } from '../world/BossSheet';
import { BossFigure } from './BossFigure';
import { bossById , familiarById } from '@/src/content/regions';
import type { Habit, LifeArea, TimeOfDay } from '@/src/game/types';
import { SortSheet } from './SortSheet';
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
import { familiarBonus } from '@/src/game/familiars';
import { ReturnReveal } from './ReturnReveal';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const now = useMinuteClock();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const save = useGameStore((s) => s.save);
  const { moveHabit, addHabit, updateHabit, archiveHabit, completeHabit, undoCompletion, setGroupBy, ensureBoard, startQuest, startBossFight, collect, skipAdventure, travel, setBossHabit, debug } =
    useGameStore.getState();
  // Habit sheet: null = closed, 'new' = add, otherwise the habit being edited.
  const [editing, setEditing] = useState<Habit | 'new' | null>(null);
  const [undo, setUndo] = useState<{ habitId: string; key: string; message: string } | null>(null);
  const [bossOpen, setBossOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preset, setPreset] = useState<{ timeOfDay?: TimeOfDay; lifeArea?: LifeArea }>({});
  const [choosing, setChoosing] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [scrapbook, setScrapbook] = useState<string | null>(null);
  const [bossSheet, setBossSheet] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const region = currentRegion(save);
  const fam = save.familiars.active ? familiarById(save.familiars.active) : undefined;
  const revealBonus = { ...familiarBonus(save), label: fam ? `${fam.name}: +${fam.bonus.pct}% ${fam.bonus.kind === 'exp' ? 'EXP' : 'gold'}` : null };

  const today = dayKey(now);
  const gauge = gaugeProgress(save, today);
  const canStart = canStartQuest(save, now);
  const mode = save.activeRun ? 'questing' : 'idle';
  const bossFight = save.activeRun?.kind === 'boss' && save.activeRun.boss ? bossById(save.activeRun.boss.bossId) : undefined;

  const wasFull = useRef(gauge.full);
  useEffect(() => {
    if (gauge.full && !wasFull.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    wasFull.current = gauge.full;
  }, [gauge.full]);

  return (
    <View style={{ flex: 1, backgroundColor: home.bg }}>
      <ScrollView scrollEnabled={!dragging} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
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
          <View style={[styles.heroWrap, bossFight && [styles.heroWrapBoss, { width: Math.min(350, width - 2 * space.screen) }]]}>
            {mode === 'questing' && !bossFight && <Slime reduced={reduced} />}
            {bossFight && <BossFigure bossId={bossFight.id} name={bossFight.name} reduced={reduced} />}
            {save.familiars.active && <FamiliarBuddy id={save.familiars.active} />}
            <HeroSprite
              player={save.player}
              anim={mode === 'questing' ? 'fight' : 'idle'}
              height={210}
              paused={!focused}
              accessibilityLabel={mode === 'idle' ? 'Your hero, resting at home' : bossFight ? `Your hero, fighting ${bossFight.name}` : 'Your hero, out on an adventure'}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ marginTop: space.l }}>
            <QuestStatus
              save={save}
              gauge={gauge}
              canStart={canStart}
              startedToday={save.lastQuestStartedDayKey === today}
              now={now}
              onSkip={__DEV__ ? (outcome) => skipAdventure(new Date(), outcome) : undefined}
              onBossHabit={() => setBossSheet(true)}
              onBoss={() => setBossOpen(true)}
              onChoose={() => {
                ensureBoard(new Date());
                setChoosing(true);
              }}
            />
          </View>
          <HabitList
            save={save}
            today={today}
            onComplete={(h, key) => {
              completeHabit(h.id, key, new Date());
              setUndo({ habitId: h.id, key, message: `${h.emoji} ${h.name} · done` });
            }}
            onEdit={(h) => setEditing(h)}
            onAdd={(preset) => {
              setPreset(preset);
              setEditing('new');
            }}
            onSort={() => setSortOpen(true)}
            onMove={moveHabit}
            onDragging={setDragging}
          />
          <Button title="+ New habit" variant="outline" outlineColor={home.text} onPress={() => { setPreset({}); setEditing('new'); }} />
        </View>
      </ScrollView>

      <SortSheet visible={sortOpen} value={save.settings.groupBy} onClose={() => setSortOpen(false)} onChoose={setGroupBy} />
      <UndoToast message={notice} bottom={insets.bottom + 72} onDone={() => setNotice(null)} />
      <UndoToast
        message={undo?.message ?? null}
        bottom={insets.bottom + 72}
        onDone={() => setUndo(null)}
        onUndo={() => {
          if (undo) undoCompletion(undo.habitId, undo.key, new Date());
          setUndo(null);
        }}
      />
      {editing !== null && (
      <HabitSheet
        bossTokens={bossTokens(save)}
        isBossHabit={editing !== 'new' && editing?.id === save.boss.habitId}
        visible
        habit={editing === 'new' ? null : editing}
        preset={preset}
        onClose={() => setEditing(null)}
        onSave={(d) => (editing && editing !== 'new' ? updateHabit(editing.id, d) : addHabit(d.name, d.schedule, new Date(), d))}
        onArchive={archiveHabit}
      />
      )}
      <BossSheet
        visible={bossOpen}
        save={save}
        onClose={() => setBossOpen(false)}
        onAdventureInstead={() => {
          setBossOpen(false);
          ensureBoard(new Date());
          setChoosing(true);
        }}
        onFight={(bossId, difficulty) => {
          setBossOpen(false);
          ensurePermission()
            .catch(() => false)
            .then(() => {
              if (!startBossFight(bossId, difficulty, new Date())) setNotice('The boss fight could not start. Check your tokens and try again.');
            });
        }}
      />
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
        bonus={revealBonus}
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
  // Boss fight: hero on the left, the boss looming on the right.
  heroWrapBoss: { width: 350, alignItems: 'flex-start', paddingLeft: 10 },
  hud: { position: 'absolute', left: space.screen, right: space.screen, flexDirection: 'row', gap: space.s },
  buddy: { position: 'absolute', left: 10, bottom: 14, width: 42, height: 36, borderTopLeftRadius: 21, borderTopRightRadius: 21, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: '#C79A5B', alignItems: 'center', justifyContent: 'center' },
  buddyEyes: { flexDirection: 'row', gap: 8, marginTop: -2 },
  eye: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2A2623' },
  hudRow2: { position: 'absolute', left: space.screen, right: space.screen, flexDirection: 'row', gap: space.s },
  tapChip: { minHeight: 32, justifyContent: 'center' },
  chip: { backgroundColor: hud.bg, borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: space.xs },
  body: { paddingHorizontal: space.screen, gap: space.xxl },
});
