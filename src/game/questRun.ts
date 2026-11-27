import { FAIL_REWARD_FRACTION, QUEST_BASE_MS, QUEST_CUT_MS, QUEST_FLOOR_MS } from './config';
import { dayKey } from './dates';
import { canStartQuest } from './gauge';
import { addExp } from './progression';
import { powerOf, speedFactor } from './stats';
import { rollDrop } from './drops';
import { successChance } from './quests';
import { QUEST_TEMPLATES } from '../content/quests';
import type { Completion, QuestRun, SaveData } from './types';

const completionKey = (c: Completion) => `${c.habitId}|${c.dayKey}`;

export function startQuest(s: SaveData, offerId: string, now: Date): SaveData {
  if (!canStartQuest(s, now)) throw new Error('A quest cannot be started right now.');
  const offer = s.board?.offers.find((o) => o.id === offerId);
  if (!offer) throw new Error(`Unknown quest offer: ${offerId}`);
  const today = dayKey(now);
  return {
    ...s,
    activeRun: {
      offer,
      dayKey: today,
      startedAt: now.toISOString(),
      successChance: successChance(powerOf(s.player), offer.requiredPower),
      preStartKeys: s.completions.map(completionKey),
      speedFactor: speedFactor(s.player),
    },
    lastQuestStartedDayKey: today,
  };
}

/** Derived from timestamps, so it stays correct while the app is closed. */
export function questEndTime(run: QuestRun, completions: Completion[]): Date {
  const start = new Date(run.startedAt).getTime();
  const pre = new Set(run.preStartKeys ?? []);
  const cuts = completions.filter((c) => new Date(c.at).getTime() >= start && !pre.has(completionKey(c))).length;
  const duration = Math.max(QUEST_FLOOR_MS, QUEST_BASE_MS - cuts * QUEST_CUT_MS) * (run.speedFactor ?? 1);
  return new Date(start + Math.round(duration));
}

export function isReturned(run: QuestRun, completions: Completion[], now: Date): boolean {
  return now.getTime() >= questEndTime(run, completions).getTime();
}

/** `force` resolves immediately (the testing Skip button). */
export function resolveQuest(s: SaveData, now: Date, rng: () => number, force = false): SaveData {
  const run = s.activeRun;
  if (!run || (!force && !isReturned(run, s.completions, now))) return s;
  const success = rng() < run.successChance;
  const drop = success ? rollDrop(run.offer.difficulty, s.player, rng) : null;
  const share = success ? 1 : FAIL_REWARD_FRACTION;
  const result = {
    offer: run.offer,
    success,
    exp: Math.round(run.offer.rewardExp * share),
    gold: Math.round(run.offer.rewardGold * share),
    resolvedAt: now.toISOString(),
    story: storyFor(run.offer.templateId, success),
    ...(drop ? { drop: { gearId: drop.id } } : {}),
  };
  return { ...s, activeRun: null, pendingResult: result, questLog: [...s.questLog, result] };
}

function storyFor(templateId: string, success: boolean): string | undefined {
  const t = QUEST_TEMPLATES.find((q) => q.id === templateId);
  return t ? (success ? t.success : t.failure) : undefined;
}

export function collectResult(s: SaveData): { save: SaveData; levelsGained: number } {
  const r = s.pendingResult;
  if (!r) return { save: s, levelsGained: 0 };
  const inventory = r.drop
    ? [...s.player.inventory, { uid: `${r.resolvedAt}-${r.drop.gearId}`, gearId: r.drop.gearId, obtainedAt: r.resolvedAt }]
    : s.player.inventory;
  const { player, levelsGained } = addExp({ ...s.player, inventory, gold: s.player.gold + r.gold }, r.exp);
  return { save: { ...s, player, pendingResult: null }, levelsGained };
}
