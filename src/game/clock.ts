/**
 * The app's clock. In development the Debug menu can move it forward
 * ("Skip 3 hours", "Start new day") by storing an offset in the save.
 * Use clockNow() instead of new Date() for "now".
 */
let offsetMs = 0;

export function setClockOffset(ms: number): void {
  offsetMs = ms;
}

export function clockNow(): Date {
  return new Date(Date.now() + offsetMs);
}
