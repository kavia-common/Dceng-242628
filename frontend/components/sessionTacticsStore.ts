export type ConfirmedPattern = any;
export type PendingPattern = any;

export interface TacticsSnapshot {
  userConfirmedPatterns: ConfirmedPattern[];
  otherConfirmedPatterns: ConfirmedPattern[];
  pendingPatterns: PendingPattern[];
}

/**
 * In-memory store for per-session tactics state.
 *
 * Why: Expo Router navigation can remount screens (or lose component state)
 * when navigating to detail pages and back. This store provides an immediate
 * local rehydration so tactic badges don't "disappear" while the screen refetches.
 *
 * Note: This is intentionally NOT persisted to disk. Server reload remains the
 * source of truth; this store is just for seamless navigation UX.
 */
const store = new Map<string, TacticsSnapshot>();

// PUBLIC_INTERFACE
export function getTacticsSnapshot(sessionId: string): TacticsSnapshot | undefined {
  /** Get last known tactics snapshot for a session (if available). */
  return store.get(sessionId);
}

// PUBLIC_INTERFACE
export function setTacticsSnapshot(sessionId: string, snapshot: TacticsSnapshot): void {
  /** Save tactics snapshot for a session. */
  store.set(sessionId, snapshot);
}

// PUBLIC_INTERFACE
export function clearTacticsSnapshot(sessionId: string): void {
  /** Clear tactics snapshot for a session (optional cleanup). */
  store.delete(sessionId);
}
