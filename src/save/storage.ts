import Storage from './kvStore';
import type { SaveData } from '../game/types';
import { migrate } from './migrate';

const KEY = 'save';

export async function loadSave(): Promise<SaveData> {
  const text = await Storage.getItem(KEY);
  let raw: unknown = null;
  if (text !== null) {
    try {
      raw = JSON.parse(text);
    } catch {
      raw = text;
    }
  }
  const { save, recovered } = migrate(raw);
  if (recovered && text !== null) await Storage.setItem(`${KEY}-backup-${new Date().toISOString()}`, text);
  return save;
}

export async function writeSave(s: SaveData): Promise<void> {
  await Storage.setItem(KEY, JSON.stringify(s));
}
