import { clockNow } from '@/src/game/clock';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMinuteClock } from '../useMinuteClock';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dayKey } from '@/src/game/dates';
import { canStartQuest, gaugeProgress } from '@/src/game/gauge';
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
import { MapSheet } from '../world/MapSheet';
import { ScrapbookSheet } from '../world/ScrapbookSheet';
import { BossHabitSheet } from '../world/BossHabitSheet';
import { bossTokens } from '@/src/game/bosses';
import { currentRegion, placeId } from '@/src/game/world';
import { placeOf } from '@/src/content/places';
import { expToNext } from '@/src/game/progression';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { familiarBonus } from '@/src/game/familiars';
import { ReturnReveal } from './ReturnReveal';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const now = useMinuteClock();
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const save = useGameStore((s) => s.save);
  const { goHome, moveHabit, addHabit, updateHabit, archiveHabit, completeHabit, undoCompletion, setGroupBy, ensureBoard, startQuest, startBossFight, collect, skipAdventure, travel, setBossHabit } =
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
  const region = currentRegion(save);
  const runRegion = save.activeRun?.offer.regionId;
  // Out on a trip: the region it happens in. Otherwise: home, or the region you travelled to.
  const scenePlace = save.activeRun ? (runRegion ?? region.id) : placeId(save);
  const pal = placeOf(scenePlace);
  const appearance = useMemo(() => ({ look: save.profile.look, pronouns: save.profile.pronouns }), [save.profile.look, save.profile.pronouns]);
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
    <View style={{ flex: 1, backgroundColor: pal.bottom }}>
      {/* Pull-down area: the place's wall/sky colour, feathered into the floor colour. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.6 }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="pull" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={pal.top} />
              <Stop offset="0.7" stopColor={pal.top} />
              <Stop offset="1" stopColor={pal.bottom} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#pull)" />
        </Svg>
      </View>
      <ScrollView scrollEnabled={!dragging} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <View style={[styles.stage, { height: Math.max(300, height * 0.45) }]}>
          <HomeScene place={scenePlace} />
          <View style={[styles.mapRow, { top: insets.top + space.s }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Map. You are at ${scenePlace === 'home' ? 'home' : region.name}`}
              hitSlop={6}
              onPress={() => setMapOpen(true)}
              style={({ pressed }) => [styles.chip, styles.tapChip, { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: pressed ? 0.75 : 1 }]}
            >
              <MapIcon color={hud.text} />
              <Text variant="label" style={{ color: hud.text }}>{scenePlace === 'home' ? 'Home' : region.name}</Text>
            </Pressable>
          </View>
          <View style={[styles.heroWrap, bossFight && [styles.heroWrapBoss, { width: Math.min(350, width - 2 * space.screen) }]]}>
            {mode === 'questing' && !bossFight && <Slime reduced={reduced} />}
            {bossFight && <BossFigure bossId={bossFight.id} name={bossFight.name} reduced={reduced} />}
            {save.familiars.active && <FamiliarBuddy id={save.familiars.active} />}
            <HeroSprite
              player={save.player}
              anim={mode === 'questing' ? 'fight' : 'idle'}
              appearance={appearance}
              height={210}
              paused={!focused}
              accessibilityLabel={mode === 'idle' ? 'Your hero, resting at home' : bossFight ? `Your hero, fighting ${bossFight.name}` : 'Your hero, out on an adventure'}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={{ marginTop: space.m, flexDirection: 'row', alignItems: 'center', gap: space.m }} accessible accessibilityLabel={`Level ${save.player.level}, ${save.player.exp} of ${expToNext(save.player.level)} EXP`}>
            <Text variant="bodyStrong" style={{ color: home.text }}>Lv {save.player.level}</Text>
            <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,248,236,0.18)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (save.player.exp / expToNext(save.player.level)) * 100)}%`, height: '100%', backgroundColor: home.fill.gold }} />
            </View>
          </View>
          <View>
            <QuestStatus
              save={save}
              gauge={gauge}
              canStart={canStart}
              startedToday={save.lastQuestStartedDayKey === today}
              now={now}
              onSkip={__DEV__ ? (outcome) => skipAdventure(clockNow(), outcome) : undefined}
              onBossHabit={() => setBossSheet(true)}
              onBoss={() => setBossOpen(true)}
              onChoose={() => {
                ensureBoard(clockNow());
                setChoosing(true);
              }}
            />
          </View>
          <HabitList
            save={save}
            today={today}
            onComplete={(h, key) => {
              completeHabit(h.id, key, clockNow());
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
          if (undo) undoCompletion(undo.habitId, undo.key, clockNow());
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
        onSave={(d) => (editing && editing !== 'new' ? updateHabit(editing.id, d) : addHabit(d.name, d.schedule, clockNow(), d))}
        onArchive={archiveHabit}
      />
      )}
      <BossSheet
        visible={bossOpen}
        save={save}
        onClose={() => setBossOpen(false)}
        onAdventureInstead={() => {
          setBossOpen(false);
          ensureBoard(clockNow());
          setChoosing(true);
        }}
        onFight={(bossId, difficulty) => {
          setBossOpen(false);
          ensurePermission()
            .catch(() => false)
            .then(() => {
              if (!startBossFight(bossId, difficulty, clockNow())) setNotice('The boss fight could not start. Check your tokens and try again.');
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
            .then(() => startQuest(id, clockNow()));
        }}
      />
      <MapSheet
        visible={mapOpen}
        save={save}
        now={now}
        onClose={() => setMapOpen(false)}
        onTravel={(id) => {
          travel(id, clockNow());
          setMapOpen(false);
        }}
        onGoHome={() => {
          goHome();
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
        onChoose={(id) => setBossHabit(id, clockNow())}
      />
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


const styles = StyleSheet.create({
  stage: { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 44, overflow: 'hidden' },
  heroWrap: { width: 250, alignItems: 'center', justifyContent: 'flex-end' },
  // Boss fight: hero on the left, the boss looming on the right.
  heroWrapBoss: { width: 350, alignItems: 'flex-start', paddingLeft: 10 },
  hud: { position: 'absolute', left: space.screen, right: space.screen, flexDirection: 'row', gap: space.s },
  buddy: { position: 'absolute', left: 10, bottom: 14, width: 42, height: 36, borderTopLeftRadius: 21, borderTopRightRadius: 21, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: '#C79A5B', alignItems: 'center', justifyContent: 'center' },
  buddyEyes: { flexDirection: 'row', gap: 8, marginTop: -2 },
  eye: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2A2623' },
  mapRow: { position: 'absolute', right: space.screen, flexDirection: 'row' },
  hudRow2: { position: 'absolute', left: space.screen, right: space.screen, flexDirection: 'row', gap: space.s },
  tapChip: { minHeight: 32, justifyContent: 'center' },
  chip: { backgroundColor: hud.bg, borderRadius: radius.chip, paddingHorizontal: space.m, paddingVertical: space.xs },
  body: { paddingHorizontal: space.screen, gap: space.xxl },
});

/** Folded-map icon (line style, matches the type). */
function MapIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z M9 4v14 M15 6v14" stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}
