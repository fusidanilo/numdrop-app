/**
 * Development sandbox: no real life loss / game over, score does not increase
 * (combo and chains still update for testing tiers and mechanics).
 * Power-ups: 3 charges per type at sandbox start; new drop every 5 consecutive hits.
 *
 * Toggle on the "Ready?" screen (before a run):
 * - Visible if __DEV__, or EXPO_PUBLIC_DEV_GAME_MODE is truthy (1/true/yes), or FORCE_DEV_GAME_MODE.
 * - The env var alone does not enable sandbox in-game: it only shows the toggle on non-debug builds (e.g. QA).
 * - To play in sandbox: toggle ON before Start (session) and/or FORCE_DEV_GAME_MODE = true in code (locks toggle).
 *
 * CI: [.github/workflows/mobile-cicd.yml] passes EXPO_PUBLIC_DEV_GAME_MODE (default false).
 */

export const FORCE_DEV_GAME_MODE = false;

let sessionDevSandbox = false;

export function setSessionDevSandbox(enabled: boolean): void {
  sessionDevSandbox = enabled;
}

export function getSessionDevSandbox(): boolean {
  return sessionDevSandbox;
}

/** Expo public env truthy → readable in the bundle (default outside build = false). */
function expoPublicDevGameModeTruthy(): boolean {
  if (typeof process === 'undefined') return false;
  const raw = process.env.EXPO_PUBLIC_DEV_GAME_MODE;
  if (raw == null || String(raw).trim() === '') return false;
  const v = String(raw).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Show the sandbox block on the pre-game (Ready) screen.
 * Release without env: hidden; QA build with env=true: visible.
 */
export function showSandboxControlsOnReady(): boolean {
  return __DEV__ || FORCE_DEV_GAME_MODE || expoPublicDevGameModeTruthy();
}

/** FORCE in code only: sandbox always on and toggle not editable. */
export function isSandboxForced(): boolean {
  return FORCE_DEV_GAME_MODE;
}

export function isDevGameMode(): boolean {
  return isSandboxForced() || sessionDevSandbox;
}
