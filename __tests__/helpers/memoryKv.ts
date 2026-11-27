/** In-memory stand-in for expo-sqlite/kv-store. */
export const memoryStore = new Map<string, string>();
const Storage = {
  getItem: async (k: string) => memoryStore.get(k) ?? null,
  setItem: async (k: string, v: string) => {
    memoryStore.set(k, v);
  },
};
export default Storage;
