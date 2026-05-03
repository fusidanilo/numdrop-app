/**
 * Development sandbox: no real life loss / game over, score does not increase
 * (combo and chains still update for testing tiers and mechanics).
 * Power-ups: 3 charges per type at sandbox start; new drop every 5 consecutive hits.
 *
 * The sandbox toggle on the "Ready?" screen exists only when `__DEV__` is true
 * (Metro / debug). Release builds never expose it. Turn the toggle on before
 * Start to run that session in sandbox mode.
 */

let sessionDevSandbox = false;

export function setSessionDevSandbox(enabled: boolean): void {
  if (!__DEV__) return;
  sessionDevSandbox = enabled;
}

export function getSessionDevSandbox(): boolean {
  return sessionDevSandbox;
}

/** Whether to show the sandbox row on the pre-game (Ready) screen. */
export function showSandboxControlsOnReady(): boolean {
  return __DEV__;
}

/** Toggle locked “always sandbox” (unused; kept for UI that hides the switch). */
export function isSandboxForced(): boolean {
  return false;
}

export function isDevGameMode(): boolean {
  return __DEV__ && sessionDevSandbox;
}
