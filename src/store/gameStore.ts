import { create } from 'zustand';
import { dayKey } from '../game/dates';
import { canLogDay, complete, isCompleted, uncomplete } from '../game/habits';
import { collectResult, questEndTime, resolveQuest, startQuest as startRun } from '../game/questRun';
import { generateBoard } from '../game/quests';
import { seededRng } from '../game/rng';
import type { DayKey, SaveData, Schedule } from '../game/types';
import { scheduleReturn } from '../notify/questNotifications';
import { newSave } from '../save/migrate';
import { loadSave, writeSave } from '../save/storage';

interface GameState {
  save: SaveData;
  loaded: boolean;
  load(): Promise<void>;
  addHabit(name: string, schedule: Schedule, now?: Date): void;
  archiveHabit(id: string): void;
  toggleHabit(habitId: string, key: DayKey, now?: Date): void;
  ensureBoard(now?: Date): void;
  startQuest(offerId: string, now?: Date): void;
  tick(now?: Date): void;
  collect(): number;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useGameStore = create<GameState>((set, get) => {
  const commit = (save: SaveData) => {
    set({ save });
    writeSave(save).catch(() => {});
  };
  const rescheduleReturn = (s: SaveData) => {
    if (s.activeRun) scheduleReturn(questEndTime(s.activeRun, s.completions)).catch(() => {});
  };

  return {
    save: newSave(),
    loaded: false,

    async load() {
      const save = await loadSave();
      set({ save, loaded: true });
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
      const next = startRun(get().save, offerId, now);
      commit(next);
      rescheduleReturn(next);
    },

    tick(now = new Date()) {
      const s = get().save;
      const next = resolveQuest(s, now, Math.random);
      if (next !== s) commit(next);
    },

    collect() {
      const { save, levelsGained } = collectResult(get().save);
      commit(save);
      return levelsGained;
    },
  };
});
