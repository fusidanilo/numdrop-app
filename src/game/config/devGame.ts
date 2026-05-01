/**
 * Sandbox di sviluppo: nessuna perdita di vite / game over, punteggio non aumenta
 * (combo e catene si aggiornano normalmente per testare livelli e meccaniche).
 * Power-up: 3 cariche per tipo all’avvio in sandbox; nuovo drop ogni 5 hit consecutivi.
 *
 * Toggle sulla schermata "Ready?" (prima della partita):
 * - Visibile se __DEV__, oppure EXPO_PUBLIC_DEV_GAME_MODE è truthy (1/true/yes), oppure FORCE_DEV_GAME_MODE.
 * - La variabile d’ambiente NON attiva da sola la sandbox in gioco: serve solo a mostrare il toggle su build non-debug (es. QA).
 * - Attiva la partita in sandbox: toggle ON prima di Start (sessione) e/o FORCE_DEV_GAME_MODE = true nel codice (blocca toggle).
 *
 * CI: [.github/workflows/mobile-cicd.yml] passa EXPO_PUBLIC_DEV_GAME_MODE (default false).
 */

export const FORCE_DEV_GAME_MODE = false;

let sessionDevSandbox = false;

export function setSessionDevSandbox(enabled: boolean): void {
  sessionDevSandbox = enabled;
}

export function getSessionDevSandbox(): boolean {
  return sessionDevSandbox;
}

/** Variabile Expo pubblica truthy → può essere letta nel bundle (default fuori build = false). */
function expoPublicDevGameModeTruthy(): boolean {
  if (typeof process === 'undefined') return false;
  const raw = process.env.EXPO_PUBLIC_DEV_GAME_MODE;
  if (raw == null || String(raw).trim() === '') return false;
  const v = String(raw).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Mostrare il blocco sandbox sulla schermata pre-partita (Ready).
 * Release senza env: nascosto; build QA con env=true: visibile.
 */
export function showSandboxControlsOnReady(): boolean {
  return __DEV__ || FORCE_DEV_GAME_MODE || expoPublicDevGameModeTruthy();
}

/** Solo FORCE nel codice: sandbox sempre ON e toggle non modificabile. */
export function isSandboxForced(): boolean {
  return FORCE_DEV_GAME_MODE;
}

export function isDevGameMode(): boolean {
  return isSandboxForced() || sessionDevSandbox;
}
