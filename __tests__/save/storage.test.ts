jest.mock('expo-sqlite/kv-store', () => require('../helpers/memoryKv'));

import { memoryStore as store } from '../helpers/memoryKv';
import { loadSave, writeSave } from '@/src/save/storage';
import { newSave } from '@/src/save/migrate';

beforeEach(() => store.clear());

test('a written save loads back', async () => {
  const s = { ...newSave(), player: { level: 2, exp: 0, gold: 9, unspentSp: 3 } };
  await writeSave(s);
  expect(await loadSave()).toEqual(s);
});

test('unreadable stored text is backed up and a fresh save is returned', async () => {
  store.set('save', '{not json');
  expect(await loadSave()).toEqual(newSave());
  const backup = [...store.entries()].find(([k]) => k.startsWith('save-backup-'));
  expect(backup?.[1]).toBe('{not json');
});
