export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'any moment';
  const mins = Math.ceil(ms / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
