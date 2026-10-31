export const HOLD_DURATION_MS = 1300;
export const HOLD_RELEASE_MS = 350;
export const UNDO_WINDOW_MS = 5000;

export function holdProgress(elapsedMs: number, durationMs = HOLD_DURATION_MS): number {
  if (durationMs <= 0) return 1;
  return Math.min(1, Math.max(0, elapsedMs / durationMs));
}

export function isHoldComplete(progress: number): boolean {
  return progress >= 1;
}

export function releaseProgress(
  fromProgress: number,
  elapsedMs: number,
  durationMs = HOLD_RELEASE_MS,
): number {
  if (durationMs <= 0) return 0;
  return Math.max(0, fromProgress * (1 - elapsedMs / durationMs));
}

export function canUndo(confirmedAt: number, now: number, windowMs = UNDO_WINDOW_MS): boolean {
  return now - confirmedAt >= 0 && now - confirmedAt <= windowMs;
}

export function roundedRectPerimeter(width: number, height: number, radius: number): number {
  const r = Math.min(radius, width / 2, height / 2);
  return 2 * (width - 2 * r) + 2 * (height - 2 * r) + 2 * Math.PI * r;
}
