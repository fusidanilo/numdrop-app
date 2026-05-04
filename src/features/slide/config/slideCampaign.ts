/** Ogni N round completati si aggiorna il checkpoint (dopo sconfitta riparti dal round successivo al checkpoint). */
export const CHECKPOINT_EVERY = 5;

const GRID_SIZE = 3;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Mescolatura fissa; la difficoltà scala col numero di round. */
export function shuffleMovesForRound(_round: number): number {
  return 520;
}

export { GRID_SIZE as SLIDE_GRID_SIZE };

/** Target time (ms) per 3★ — scala col round. */
export function goldTimeMsForRound(round: number): number {
  const t = 30_000 - (round - 1) * 520;
  return clamp(Math.round(t), 15_000, 30_000);
}

export function silverTimeMsForRound(round: number): number {
  const gold = goldTimeMsForRound(round);
  const stretch = 1.48 + (round - 1) * 0.008;
  return Math.round(gold * clamp(stretch, 1.48, 1.65));
}

export function goldMovesForRound(round: number): number {
  const m = 46 - (round - 1) * 0.85;
  return Math.round(clamp(m, 28, 46));
}

export function silverMovesForRound(round: number): number {
  const gold = goldMovesForRound(round);
  return Math.round(gold * (1.58 + (round - 1) * 0.012));
}

/** Budget mosse prima della sconfitta (stesso schema “argento + margine” del design precedente). */
export function moveBudgetForRound(round: number): number {
  const silverM = silverMovesForRound(round);
  const margin = Math.max(5, Math.round(22 - (round - 1) * 0.85));
  return silverM + margin;
}

/** Prossimo round multiplo di CHECKPOINT_EVERY (per UI “checkpoint tra X round”). */
export function nextCheckpointRound(currentRound: number): number {
  return Math.ceil(currentRound / CHECKPOINT_EVERY) * CHECKPOINT_EVERY;
}
