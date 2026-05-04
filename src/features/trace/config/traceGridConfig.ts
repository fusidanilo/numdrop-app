function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Side length of the square Trace grid for this round. */
export function traceGridSizeForRound(round: number): 4 | 5 | 6 {
  if (round <= 6) return 4;
  if (round <= 14) return 5;
  return 6;
}

/**
 * Target number of figure cells (self-avoiding path length).
 * Scales with round and bumps on larger grids so 5×5 / 6×6 feel denser.
 */
export function cellCountForRound(round: number, gridSize: number): number {
  const area = gridSize * gridSize;
  let n = 5 + Math.floor((round - 1) * 0.55);
  if (gridSize >= 5) n += 4;
  if (gridSize >= 6) n += 6;

  const minByGrid = gridSize === 4 ? 5 : gridSize === 5 ? 8 : 11;
  const maxByGrid = gridSize === 4 ? 14 : gridSize === 5 ? 23 : 32;
  return clamp(n, minByGrid, Math.min(maxByGrid, area - 1));
}
