import { MAZE_TOTAL_TIME_MS } from '@/features/maze/styles/maze.styles';

/**
 * Bonus time after a successful round. Early rounds keep ~3s per tile; later
 * rounds taper so skilled runs cannot farm the clock indefinitely.
 */
export function computeTimeBonusMs(roundCompleted: number, sequenceLength: number): number {
  const basePerTile = 3000;
  const factor = Math.max(0.33, 1 - (roundCompleted - 1) * 0.06);
  return Math.round(sequenceLength * basePerTile * factor);
}

/**
 * Max time the Path timer can hold while playing this round. Slowly drops so
 * refills cannot always top the bar back to a full minute.
 */
export function computeTimeCapMs(round: number): number {
  const minCap = 10_000;
  const decayPerRound = 900;
  return Math.max(minCap, MAZE_TOTAL_TIME_MS - (round - 1) * decayPerRound);
}
