import { create } from 'zustand';
import { dayKey } from '../game/dates';
import { canStartQuest } from '../game/gauge';
import { canLogDay, complete, hideCompletion, isCompleted, uncomplete } from '../game/habits';
import { collectResult, questEndTime, resolveQuest, startBossFight as startBoss, startQuest as startRun } from '../game/questRun';
import { generateBoard } from '../game/quests';
import { seededRng } from '../game/rng';
import { classTitle } from '../game/classTitle';
import { gearById } from '../content/gear';
import { allocateSp as spendPoint, respec as resetPoints } from '../game/stats';
import type { BossDifficulty, DayKey, Habit, LifeArea, Player, SaveData, Schedule, Slot, StatKey, TimeOfDay } from '../game/types';
import { setBossHabit as chooseBossHabit } from '../game/bosses';
import { debugAction, type DebugAction } from '../game/debug';
import { currentRegion, travel as travelTo } from '../game/world';
import { cancelReturn, scheduleReturn } from '../notify/questNotifications';
import { newSave } from '../save/migrate';
import { loadSave, writeSave } from '../save/storage';

export type HabitDetails = { name: string; schedule: Schedule; emoji: string; lifeArea: LifeArea; timeOfDay: TimeOfDay };

interface GameState {
  save: SaveData;
  loaded: boolean;
  /** True when the stored save could not be read; we then never write, so it is not overwritten. */
  persistBlocked: boolean;
  load(): Promise<void>;
  addHabit(name: string, schedule: Schedule, now?: Date, details?: Partial<HabitDetails>): void;
  updateHabit(id: string, details: Partial<HabitDetails>): void;
  /** Marks a habit done. Home never unticks; mistakes use undoCompletion (the Undo popup). */
  completeHabit(habitId: string, key: DayKey, now?: Date): void;
  undoCompletion(habitId: string, key: DayKey, now?: Date): void;
  hideFromHistory(habitId: string, key: DayKey): void;
  setGroupBy(groupBy: SaveData['settings']['groupBy']): void;
  /** Starts a boss fight instead of the day's adventure. Returns false if it can't start. */
  startBossFight(bossId: string, difficulty: BossDifficulty, now?: Date): boolean;
  archiveHabit(id: string): void;
  toggleHabit(habitId: string, key: DayKey, now?: Date): void;
  ensureBoard(now?: Date): void;
  startQuest(offerId: string, now?: Date): void;
  travel(regionId: string, now?: Date): void;
  setBossHabit(habitId: string, now?: Date): void;
  setActiveFamiliar(id: string | null): void;
  /** Development builds only. */
  debug(action: DebugAction, now?: Date): void;
  tick(now?: Date): void;
  /** Collects the result; with `equipDrop`, also equips the dropped item. Returns levels gained. */
  collect(equipDrop?: boolean): number;
  /** Testing only: finish the running adventure now. */
  skipAdventure(now?: Date): void;
  allocateSp(stat: StatKey): void;
  respec(): void;
  equip(uid: string): void;
  unequip(slot: Slot): void;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useGameStore = create<GameState>((set, get) => {
  const commit = (save: SaveData) => {
    set({ save });
    if (!get().persistBlocked) writeSave(save).catch(() => {});
  };
  /** Character changes never touch the active run, so odds and return time stay fixed. */
  const setPlayer = (p: Player) => commit({ ...get().save, player: { ...p, title: classTitle(p) } });
  const rescheduleReturn = (s: SaveData) => {
    if (s.activeRun) scheduleReturn(questEndTime(s.activeRun, s.completions)).catch(() => {});
  };

  return {
    save: newSave(),
    loaded: false,
    persistBlocked: false,

    async load() {
      try {
        const save = await loadSave();
        set({ save, loaded: true, persistBlocked: false });
      } catch {
        set({ save: newSave(), loaded: true, persistBlocked: true });
      }
    },

    addHabit(name, schedule, now = new Date(), details = {}) {
      const s = get().save;
      const habit: Habit = {
        id: newId(),
        name: name.trim(),
        schedule,
        createdAt: now.toISOString(),
        archived: false,
        emoji: details.emoji || '✨',
        lifeArea: details.lifeArea ?? 'other',
        timeOfDay: details.timeOfDay ?? 'anytime',
      };
      commit({ ...s, habits: [...s.habits, habit] });
    },

    updateHabit(id, details) {
      const s = get().save;
      commit({ ...s, habits: s.habits.map((h) => (h.id === id ? { ...h, ...details, name: (details.name ?? h.name).trim() } : h)) });
    },

    completeHabit(habitId, key, now = new Date()) {
      if (!canLogDay(key, now) || isCompleted(get().save.completions, habitId, key)) return;
      get().toggleHabit(habitId, key, now);
    },

    undoCompletion(habitId, key, now = new Date()) {
      if (!isCompleted(get().save.completions, habitId, key)) return;
      get().toggleHabit(habitId, key, now);
    },

    hideFromHistory(habitId, key) {
      const s = get().save;
      commit({ ...s, completions: hideCompletion(s.completions, habitId, key) });
    },

    setGroupBy(groupBy) {
      commit({ ...get().save, settings: { ...get().save.settings, groupBy } });
    },

    startBossFight(bossId, difficulty, now = new Date()) {
      const s = get().save;
      let next: SaveData;
      try {
        next = startBoss(s, now, { bossId, difficulty });
      } catch {
        return false;
      }
      commit(next);
      rescheduleReturn(next);
      return true;
    },

    archiveHabit(id) {
      const s = get().save;
      commit({ ...s, habits: s.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)) });
    },

    toggleHabit(habitId, key, now = new Date()) {
      if (!canLogDay(key, now)) return;
      get().tick(now); // a hero who is already home stays home
      const s = get().save;
      const completions = isCompleted(s.completions, habitId, key)
        ? uncomplete(s.completions, habitId, key)
        : complete(s.completions, habitId, key, now);
      const next = { ...s, completions };
      commit(next);
      rescheduleReturn(next);
    },

    ensureBoard(now = new Date()) {
      const s = get().save;
      const today = dayKey(now);
      if (s.board?.dayKey === today) return;
      commit({ ...s, board: { dayKey: today, offers: generateBoard(today, s.player, seededRng(today), currentRegion(s).id) } });
    },

    startQuest(offerId, now = new Date()) {
      get().ensureBoard(now);
      const s = get().save;
      if (!canStartQuest(s, now) || !s.board?.offers.some((o) => o.id === offerId)) return;
      const next = startRun(s, offerId, now);
      commit(next);
      rescheduleReturn(next);
    },

    tick(now = new Date()) {
      const s = get().save;
      const next = resolveQuest(s, now, Math.random);
      if (next !== s) commit(next);
    },

    travel(regionId, now = new Date()) {
      const s = get().save;
      const next = travelTo(s, regionId, now);
      if (next !== s) commit(next);
    },

    setBossHabit(habitId, now = new Date()) {
      commit(chooseBossHabit(get().save, habitId, now));
    },

    setActiveFamiliar(id) {
      const s = get().save;
      if (id !== null && !s.familiars.owned.includes(id)) return;
      commit({ ...s, familiars: { ...s.familiars, active: id } });
    },

    debug(action, now = new Date()) {
      commit(debugAction(get().save, action, now));
    },

    skipAdventure(now = new Date()) {
      const s = get().save;
      const next = resolveQuest(s, now, Math.random, true);
      if (next === s) return;
      commit(next);
      cancelReturn().catch(() => {});
    },

    collect(equipDrop = false) {
      const drop = get().save.pendingResult?.drop;
      const before = new Set(get().save.player.inventory.map((i) => i.uid));
      const { save, levelsGained } = collectResult(get().save);
      commit(save);
      if (equipDrop && drop) {
        const added = save.player.inventory.find((i) => !before.has(i.uid));
        if (added) get().equip(added.uid);
      }
      return levelsGained;
    },

    allocateSp(stat) {
      const p = get().save.player;
      const next = spendPoint(p, stat);
      if (next !== p) setPlayer(next);
    },

    respec() {
      setPlayer(resetPoints(get().save.player));
    },

    equip(uid) {
      const p = get().save.player;
      const def = gearById(p.inventory.find((i) => i.uid === uid)?.gearId ?? '');
      if (!def) return;
      setPlayer({ ...p, equipped: { ...p.equipped, [def.slot]: uid } });
    },

    unequip(slot) {
      const p = get().save.player;
      const equipped = { ...p.equipped };
      delete equipped[slot];
      setPlayer({ ...p, equipped });
    },
  };
});
