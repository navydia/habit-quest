import { clockNow, setClockOffset } from '../game/clock';
import { create } from 'zustand';
import { dayKey } from '../game/dates';
import { canStartQuest } from '../game/gauge';
import { canLogDay, complete, hideCompletion, isCompleted, uncomplete } from '../game/habits';
import { collectResult, questEndTime, resolveQuest, startBossFight as startBoss, startQuest as startRun } from '../game/questRun';
import { generateBoard } from '../game/quests';
import { seededRng } from '../game/rng';
import { classTitle } from '../game/classTitle';
import { claimDaily as claimQuest, ensureDaily as makeDaily, progressDaily, syncHabitDaily } from '../game/daily';
import { buyGear as buyFromArmory, buyPotion as buyFromApothecary, drinkPotion as drink } from '../game/shop';
import { moveHabit as reorder, type MoveTarget } from '../game/ordering';
import { gearById } from '../content/gear';
import { allocateSp as spendPoint, respec as resetPoints } from '../game/stats';
import type { BossDifficulty, DayKey, Habit, LifeArea, Look, Player, Profile, SaveData, Schedule, Slot, StatKey, TimeOfDay } from '../game/types';
import { setBossHabit as chooseBossHabit } from '../game/bosses';
import { debugAction, type DebugAction } from '../game/debug';
import { currentRegion, goHome as goHomeRule, travel as travelTo } from '../game/world';
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
  archiveHabit(id: string, now?: Date): void;
  toggleHabit(habitId: string, key: DayKey, now?: Date): void;
  ensureBoard(now?: Date): void;
  startQuest(offerId: string, now?: Date): void;
  travel(regionId: string, now?: Date): void;
  setBossHabit(habitId: string, now?: Date): void;
  setActiveFamiliar(id: string | null): void;
  /** Development builds only. */
  debug(action: DebugAction, now?: Date): void;
  goHome(): void;
  setProfile(patch: Partial<Omit<Profile, 'look'>> & { look?: Partial<Look> }): void;
  tick(now?: Date): void;
  /** Collects the result; with `equipDrop`, also equips the dropped item. Returns levels gained. */
  collect(equipDrop?: boolean): number;
  /** Testing only: finish the running adventure now. */
  skipAdventure(now?: Date, outcome?: 'win' | 'lose'): void;
  moveHabit(id: string, target: MoveTarget): void;
  allocateSp(stat: StatKey): void;
  respec(): void;
  equip(uid: string, now?: Date): void;
  ensureDaily(now?: Date): void;
  claimDaily(id: string): void;
  /** Returns an error message, or undefined on success. */
  buyGear(slotId: string, now?: Date): string | undefined;
  buyPotion(id: string, now?: Date): string | undefined;
  drinkPotion(id: string, now?: Date): string | undefined;
  unequip(slot: Slot): void;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useGameStore = create<GameState>((set, get) => {
  const commit = (save: SaveData) => {
    set({ save });
    if (!get().persistBlocked) writeSave(save).catch(() => {});
  };
  const progress = (event: string, now: Date) => commit(progressDaily(get().save, event, now));
  /** Counts a successful adventure that just came back (for the daily quest). */
  const afterResolve = (before: SaveData, now: Date) => {
    const r = get().save.pendingResult;
    if (r && r !== before.pendingResult && r.success && r.kind !== 'boss') progress('adventure', now);
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
        setClockOffset(save.dev?.offsetMs ?? 0);
        set({ save, loaded: true, persistBlocked: false });
      } catch {
        set({ save: newSave(), loaded: true, persistBlocked: true });
      }
    },

    addHabit(name, schedule, now = clockNow(), details = {}) {
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
        // New habits go to the end of the custom order.
        order: s.habits.reduce((m, h, i) => Math.max(m, h.order ?? i), -1) + 1,
      };
      commit({ ...s, habits: [...s.habits, habit] });
    },

    updateHabit(id, details) {
      const s = get().save;
      commit({ ...s, habits: s.habits.map((h) => (h.id === id ? { ...h, ...details, name: (details.name ?? h.name).trim() } : h)) });
    },

    completeHabit(habitId, key, now = clockNow()) {
      if (!canLogDay(key, now) || isCompleted(get().save.completions, habitId, key)) return;
      get().toggleHabit(habitId, key, now);
      commit(syncHabitDaily(get().save, now));
    },

    undoCompletion(habitId, key, now = clockNow()) {
      if (!isCompleted(get().save.completions, habitId, key)) return;
      get().toggleHabit(habitId, key, now);
      commit(syncHabitDaily(get().save, now));
    },

    hideFromHistory(habitId, key) {
      const s = get().save;
      commit({ ...s, completions: hideCompletion(s.completions, habitId, key) });
    },

    setGroupBy(groupBy) {
      commit({ ...get().save, settings: { ...get().save.settings, groupBy } });
    },

    startBossFight(bossId, difficulty, now = clockNow()) {
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

    archiveHabit(id, now = clockNow()) {
      const s = get().save;
      const habits = s.habits.map((h) => (h.id === id ? { ...h, archived: true } : h));
      // Archiving the boss habit clears it (tokens reset; the sheet warns first).
      const boss = s.boss.habitId === id ? { habitId: null, tokenEpoch: now.toISOString(), spentKeys: [], bonusTokens: 0 } : s.boss;
      commit({ ...s, habits, boss });
    },

    toggleHabit(habitId, key, now = clockNow()) {
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

    ensureBoard(now = clockNow()) {
      const s = get().save;
      const today = dayKey(now);
      if (s.board?.dayKey === today) return;
      commit({ ...s, board: { dayKey: today, offers: generateBoard(today, s.player, seededRng(today), currentRegion(s).id) } });
    },

    startQuest(offerId, now = clockNow()) {
      get().ensureBoard(now);
      const s = get().save;
      if (!canStartQuest(s, now) || !s.board?.offers.some((o) => o.id === offerId)) return;
      const next = startRun(s, offerId, now);
      commit(next);
      rescheduleReturn(next);
    },

    tick(now = clockNow()) {
      const s = get().save;
      const next = resolveQuest(s, now, Math.random);
      if (next !== s) {
        commit(next);
        afterResolve(s, now);
      }
    },

    travel(regionId, now = clockNow()) {
      const s = get().save;
      const next = travelTo(s, regionId, now);
      if (next !== s) commit(next);
    },

    setBossHabit(habitId, now = clockNow()) {
      commit(chooseBossHabit(get().save, habitId, now));
    },

    setActiveFamiliar(id) {
      const s = get().save;
      if (id !== null && !s.familiars.owned.includes(id)) return;
      commit({ ...s, familiars: { ...s.familiars, active: id } });
    },

    debug(action, now = clockNow()) {
      const next = debugAction(get().save, action, now);
      setClockOffset(next.dev?.offsetMs ?? 0);
      commit(next);
      get().tick();
    },

    goHome() {
      commit(goHomeRule(get().save));
    },

    setProfile(patch) {
      const s = get().save;
      commit({ ...s, profile: { ...s.profile, ...patch, look: { ...s.profile.look, ...(patch.look ?? {}) } } });
    },

    moveHabit(id, target) {
      const s = get().save;
      commit({ ...s, habits: reorder(s.habits, id, target) });
    },

    skipAdventure(now = clockNow(), outcome) {
      const s = get().save;
      // Forced dice: 0 wins every roll, 0.99 loses every roll.
      const rng = outcome === 'win' ? () => 0 : outcome === 'lose' ? () => 0.99 : Math.random;
      const next = resolveQuest(s, now, rng, true);
      if (next === s) return;
      commit(next);
      afterResolve(s, now);
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
      if (next !== p) {
        setPlayer(next);
        progress('sp', clockNow());
      }
    },

    ensureDaily(now = clockNow()) {
      const s = get().save;
      const next = makeDaily(s, now);
      if (next !== s) commit(next);
    },

    claimDaily(id) {
      const s = get().save;
      const next = claimQuest(s, id);
      if (next !== s) commit(next);
    },

    buyGear(slotId, now = clockNow()) {
      const r = buyFromArmory(get().save, slotId, now);
      if (r.error) return r.error;
      commit(r.save);
      progress('buy', now);
    },

    buyPotion(id, now = clockNow()) {
      const r = buyFromApothecary(get().save, id);
      if (r.error) return r.error;
      commit(r.save);
      progress('buy', now);
    },

    drinkPotion(id, now = clockNow()) {
      const r = drink(get().save, id);
      if (r.error) return r.error;
      commit(r.save);
      progress('potion', now);
    },

    respec() {
      setPlayer(resetPoints(get().save.player));
    },

    equip(uid, now = clockNow()) {
      const p = get().save.player;
      const def = gearById(p.inventory.find((i) => i.uid === uid)?.gearId ?? '');
      if (!def) return;
      setPlayer({ ...p, equipped: { ...p.equipped, [def.slot]: uid } });
      progress('equip', now);
    },

    unequip(slot) {
      const p = get().save.player;
      const equipped = { ...p.equipped };
      delete equipped[slot];
      setPlayer({ ...p, equipped });
    },
  };
});
