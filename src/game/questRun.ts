import { FAIL_REWARD_FRACTION, QUEST_BASE_MS, QUEST_CUT_MS, QUEST_FLOOR_MS } from './config';
import { dayKey } from './dates';
import { canStartQuest } from './gauge';
import { addExp } from './progression';
import { powerOf, speedFactor } from './stats';
import { rollDrop } from './drops';
import { recordClear } from './world';
import { attachBoss, resolveBoss } from './bosses';
import { bossById, regionOfBoss } from '../content/regions';
import { potionById } from '../content/shop';
import { familiarBonus } from './familiars';
import type { BossDifficulty , Completion, QuestRun, SaveData } from './types';
import { successChance } from './quests';
import { QUEST_TEMPLATES } from '../content/quests';

const completionKey = (c: Completion) => `${c.habitId}|${c.dayKey}`;

/** The active potion's effects for a trip starting now (it is used up by starting). */
function potionFor(s: SaveData) {
  const p = s.potions.active ? potionById(s.potions.active) : undefined;
  return {
    id: p?.id,
    power: p?.effect.power ?? 0,
    luck: p?.effect.luck ?? 0,
    timeMult: p?.effect.timeMult ?? 1,
    used: (save: SaveData): SaveData => (p ? { ...save, potions: { ...save.potions, active: null } } : save),
  };
}

export function startQuest(s: SaveData, offerId: string, now: Date): SaveData {
  if (!canStartQuest(s, now)) throw new Error('A quest cannot be started right now.');
  const offer = s.board?.offers.find((o) => o.id === offerId);
  if (!offer) throw new Error(`Unknown quest offer: ${offerId}`);
  const today = dayKey(now);
  const potion = potionFor(s);
  return potion.used({
    ...s,
    activeRun: {
      offer,
      dayKey: today,
      startedAt: now.toISOString(),
      successChance: successChance(powerOf(s.player) + potion.power, offer.requiredPower),
      preStartKeys: s.completions.map(completionKey),
      speedFactor: speedFactor(s.player) * potion.timeMult,
      ...(potion.id ? { potion: potion.id, luckBonus: potion.luck } : {}),
    },
    lastQuestStartedDayKey: today,
  });
}

/** A boss fight takes the place of the day's adventure: same gauge, timer and once-a-day rule. */
export function startBossFight(s: SaveData, now: Date, boss: { bossId: string; difficulty: BossDifficulty }): SaveData {
  if (!canStartQuest(s, now)) throw new Error('A boss fight cannot be started right now.');
  const def = bossById(boss.bossId);
  if (!def) throw new Error(`Unknown boss: ${boss.bossId}`);
  const potion = potionFor(s);
  const { save, runBoss } = attachBoss(s, boss, now, potion.power);
  const today = dayKey(now);
  const offer = {
    id: `${today}-boss`,
    templateId: def.id,
    name: def.name,
    flavour: def.flavour,
    difficulty: 'hard' as const,
    requiredPower: def.requiredPower,
    rewardExp: 0,
    rewardGold: 0,
    regionId: regionOfBoss(def.id)?.id,
  };
  return potion.used({
    ...save,
    activeRun: {
      kind: 'boss',
      offer,
      dayKey: today,
      startedAt: now.toISOString(),
      successChance: runBoss.successChance,
      preStartKeys: s.completions.map(completionKey),
      speedFactor: speedFactor(s.player) * potion.timeMult,
      boss: runBoss,
      ...(potion.id ? { potion: potion.id, luckBonus: potion.luck } : {}),
    },
    lastQuestStartedDayKey: today,
  });
}

/** A copy of the save whose player has extra Luck (a potion), for rolling drops. */
function withLuck(s: SaveData, bonus = 0): SaveData {
  if (!bonus) return s;
  return { ...s, player: { ...s.player, stats: { ...s.player.stats, luck: s.player.stats.luck + bonus } } };
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
  if (run.kind === 'boss') {
    const bossed = resolveBoss(withLuck(s, run.luckBonus), run, rng);
    bossed.save = { ...bossed.save, player: s.player };
    const result = {
      kind: 'boss' as const,
      offer: run.offer,
      success: !!bossed.result?.success,
      exp: 0,
      gold: 0,
      resolvedAt: now.toISOString(),
      ...(bossed.result ? { boss: bossed.result } : {}),
    };
    return { ...bossed.save, activeRun: null, pendingResult: result, questLog: [...s.questLog, result] };
  }
  const success = rng() < run.successChance;
  const lucky = withLuck(s, run.luckBonus);
  const drop = success ? rollDrop(run.offer.difficulty, lucky.player, rng) : null;
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
  const cleared = success ? recordClear(s, run.offer) : { save: s };
  const bossed = resolveBoss(withLuck(cleared.save, run.luckBonus), run, rng);
  bossed.save = { ...bossed.save, player: cleared.save.player };
  const final = {
    ...result,
    ...(cleared.memento ? { memento: cleared.memento } : {}),
    ...(bossed.result ? { boss: bossed.result } : {}),
  };
  return { ...bossed.save, activeRun: null, pendingResult: final, questLog: [...s.questLog, final] };
}

function storyFor(templateId: string, success: boolean): string | undefined {
  const t = QUEST_TEMPLATES.find((q) => q.id === templateId);
  return t ? (success ? t.success : t.failure) : undefined;
}

export function collectResult(s: SaveData): { save: SaveData; levelsGained: number } {
  const r = s.pendingResult;
  if (!r) return { save: s, levelsGained: 0 };
  const inventory = [...s.player.inventory];
  if (r.drop) inventory.push({ uid: `${r.resolvedAt}-${r.drop.gearId}`, gearId: r.drop.gearId, obtainedAt: r.resolvedAt });
  if (r.boss?.drop) inventory.push({ uid: `${r.resolvedAt}-boss-${r.boss.drop.gearId}`, gearId: r.boss.drop.gearId, obtainedAt: r.resolvedAt });
  const bonus = familiarBonus(s);
  const gold = Math.round((r.gold + (r.boss?.gold ?? 0)) * bonus.gold);
  const exp = Math.round((r.exp + (r.boss?.exp ?? 0)) * bonus.exp);
  const familiars =
    r.boss?.familiarId && !s.familiars.owned.includes(r.boss.familiarId)
      ? { owned: [...s.familiars.owned, r.boss.familiarId], active: s.familiars.active ?? r.boss.familiarId }
      : s.familiars;
  const { player, levelsGained } = addExp({ ...s.player, inventory, gold: s.player.gold + gold }, exp);
  return { save: { ...s, player, familiars, pendingResult: null }, levelsGained };
}
