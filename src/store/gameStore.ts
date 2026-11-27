import { create } from 'zustand';
import { dayKey } from '../game/dates';
import { canStartQuest } from '../game/gauge';
import { canLogDay, complete, isCompleted, uncomplete } from '../game/habits';
import { collectResult, questEndTime, resolveQuest, startQuest as startRun } from '../game/questRun';
import { generateBoard } from '../game/quests';
import { seededRng } from '../game/rng';
import { classTitle } from '../game/classTitle';
import { gearById } from '../content/gear';
import { allocateSp as spendPoint, respec as resetPoints } from '../game/stats';
import type { DayKey, Player, SaveData, Schedule, Slot, StatKey } from '../game/types';
import { scheduleReturn } from '../notify/questNotifications';
import { newSave } from '../save/migrate';
import { loadSave, writeSave } from '../save/storage';

interface GameState {
  save: SaveData;
  loaded: boolean;
  /** True when the stored save could not be read; we then never write, so it is not overwritten. */
  persistBlocked: boolean;
  load(): Promise<void>;
  addHabit(name: string, schedule: Schedule, now?: Date): void;
  archiveHabit(id: string): void;
  toggleHabit(habitId: string, key: DayKey, now?: Date): void;
  ensureBoard(now?: Date): void;
  startQuest(offerId: string, now?: Date): void;
  tick(now?: Date): void;
  collect(): number;
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

    addHabit(name, schedule, now = new Date()) {
      const s = get().save;
      const habit = { id: newId(), name: name.trim(), schedule, createdAt: now.toISOString(), archived: false };
      commit({ ...s, habits: [...s.habits, habit] });
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
      commit({ ...s, board: { dayKey: today, offers: generateBoard(today, s.player, seededRng(today)) } });
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

    skipAdventure(now = new Date()) {
      const s = get().save;
      const next = resolveQuest(s, now, Math.random, true);
      if (next !== s) commit(next);
    },

    collect() {
      const { save, levelsGained } = collectResult(get().save);
      commit(save);
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
