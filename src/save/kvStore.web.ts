// Web preview only: browser localStorage instead of SQLite (which needs extra wasm setup on web).
const Storage = {
  getItem: async (k: string) => globalThis.localStorage?.getItem(k) ?? null,
  setItem: async (k: string, v: string) => globalThis.localStorage?.setItem(k, v),
};
export default Storage;
