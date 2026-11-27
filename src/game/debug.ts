import { GEAR } from '../content/gear';
import { REGIONS } from '../content/regions';
import { newSave } from '../save/migrate';
import { BOSS_TOKENS_NEEDED } from './config';
import { dayKey } from './dates';
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
      const boss = s.boss.habitId ? s.boss : { habitId, tokenEpoch: now.toISOString(), spentKeys: [], bonusTokens: 0 };
      return { ...s, boss: { ...boss, bonusTokens: BOSS_TOKENS_NEEDED } };
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
