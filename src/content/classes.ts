import type { StatKey, WeaponType } from '../game/types';

/** Spec §7.3: class title = weapon type + highest stat. */
export const CLASS_TITLES: Record<WeaponType, Record<StatKey, string>> = {
  sword: { power: 'Vanguard', defense: 'Bulwark', luck: "Fortune's Edge", speed: 'Quick Blade' },
  bow: { power: 'Longshot', defense: 'Warden', luck: 'Trickshot', speed: 'Swiftarrow' },
  staff: { power: 'Arcanist', defense: 'Ward Mage', luck: 'Seer', speed: 'Blink Mage' },
};

export const NO_WEAPON_TITLE = 'Wanderer';
