import { GEAR } from '../content/gear';
import { REGIONS } from '../content/regions';
import { newSave } from '../save/migrate';
import { BOSS_TOKENS_NEEDED } from './config';
import { dayKey, endOfDay } from './dates';
import { complete, scheduledHabits } from './habits';
import { addExp, expToNext } from './progression';
import type { SaveData } from './types';
import { emptyProgress } from './world';

/** Testing shortcuts for the debug menu (development builds only). */
export type DebugAction = 'skip1' | 'skip3' | 'skip8' | 'newDay' | 'fillGauge' | 'bossTokens' | 'levelUp' | 'gold' | 'anotherAdventure' | 'allGear' | 'allFamiliars' | 'unlockRegions' | 'reset';

export function debugAction(s: SaveData, action: DebugAction, now: Date): SaveData {
  const today = dayKey(now);
  const shift = (ms: number): SaveData => ({ ...s, dev: { offsetMs: (s.dev?.offsetMs ?? 0) + ms } });
  switch (action) {
    case 'skip1':
      return shift(3600_000);
    case 'skip3':
      return shift(3 * 3600_000);
    case 'skip8':
      return shift(8 * 3600_000);
    case 'newDay': {
      // Jump to one minute past the start of tomorrow.
      const next = endOfDay(today);
      return shift(next.getTime() + 60_000 - now.getTime());
    }
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
    case 'anotherAdventure':
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
