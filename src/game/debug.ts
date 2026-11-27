import { GEAR } from '../content/gear';
import { REGIONS } from '../content/regions';
import { newSave } from '../save/migrate';
import { BOSS_TOKENS_NEEDED } from './config';
import { addDays, dayKey } from './dates';
import { complete, scheduledHabits } from './habits';
import { addExp, expToNext } from './progression';
import type { SaveData } from './types';
import { emptyProgress } from './world';

/** Testing shortcuts for the debug menu (development builds only). */
export type DebugAction = 'fillGauge' | 'bossTokens' | 'levelUp' | 'gold' | 'newDay' | 'allGear' | 'allFamiliars' | 'unlockRegions' | 'reset';

export function debugAction(s: SaveData, action: DebugAction, now: Date): SaveData {
  const today = dayKey(now);
  switch (action) {
    case 'fillGauge': {
      let completions = s.completions;
      for (const h of scheduledHabits(s.habits, today)) completions = complete(completions, h.id, today, now);
      return { ...s, completions };
    }
    case 'bossTokens': {
      const habitId = s.boss.habitId ?? s.habits.find((h) => !h.archived)?.id;
      if (!habitId) return s;
      const epoch = new Date(now.getTime() - 60_000);
      // Synthetic completions on earlier days, timestamped after the epoch so they count as tokens.
      const fake = Array.from({ length: BOSS_TOKENS_NEEDED }, (_, i) => ({
        habitId,
        dayKey: addDays(today, -(i + 2)),
        at: new Date(epoch.getTime() + 1000 + i).toISOString(),
      }));
      const others = s.completions.filter((c) => !fake.some((f) => f.habitId === c.habitId && f.dayKey === c.dayKey));
      return { ...s, boss: { habitId, tokenEpoch: epoch.toISOString() }, completions: [...others, ...fake] };
    }
    case 'levelUp':
      return { ...s, player: addExp(s.player, expToNext(s.player.level) - s.player.exp).player };
    case 'gold':
      return { ...s, player: { ...s.player, gold: s.player.gold + 500 } };
    case 'newDay':
      return { ...s, lastQuestStartedDayKey: null, board: null };
    case 'allGear':
      return {
        ...s,
        player: {
          ...s.player,
          inventory: [...s.player.inventory, ...GEAR.map((g, i) => ({ uid: `debug-${now.getTime()}-${i}`, gearId: g.id, obtainedAt: now.toISOString() }))],
        },
      };
    case 'allFamiliars': {
      const owned = REGIONS.map((r) => r.boss.familiar.id);
      return { ...s, familiars: { owned, active: s.familiars.active ?? owned[0] } };
    }
    case 'unlockRegions': {
      const regions = { ...s.world.regions };
      for (const r of REGIONS) regions[r.id] = regions[r.id] ?? emptyProgress();
      return { ...s, world: { ...s.world, regions } };
    }
    case 'reset':
      return newSave();
  }
}
