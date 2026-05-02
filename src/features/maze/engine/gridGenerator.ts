import type { ColorId } from '@/game/config/colors';
import { COLOR_ORDER } from '@/game/config/colors';
import type { MazeCell } from '@/features/maze/store/mazeStore';

const GRID_SIZE = 4;

const DIRECTIONS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** How many numbers to put in the target path for a given round. */
export function targetLengthForRound(round: number): number {
  return clamp(3 + Math.floor(round / 2), 3, 8);
}

/** Highest number that can appear on a tile for a given round. */
function maxNumForRound(round: number): number {
  return clamp(3 + Math.floor(round / 3), 3, 6);
}

/** How many colors are active for a given round. */
function numColorsForRound(round: number): number {
  if (round <= 2) return 1;
  if (round <= 5) return 2;
  return 3;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Walk a random non-self-intersecting path of `length` steps starting from
 * (startRow, startCol). Returns an array of {row, col} or null if no valid
 * path of the requested length can be found within maxAttempts tries.
 */
function walkPath(
  startRow: number,
  startCol: number,
  length: number,
  maxAttempts = 200,
): Array<{ row: number; col: number }> | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const path: Array<{ row: number; col: number }> = [{ row: startRow, col: startCol }];
    const visited = new Set<string>([`${startRow},${startCol}`]);

    while (path.length < length) {
      const current = path[path.length - 1];
      const dirs = shuffle(DIRECTIONS);
      let moved = false;

      for (const { dr, dc } of dirs) {
        const nr = current.row + dr;
        const nc = current.col + dc;
        const key = `${nr},${nc}`;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && !visited.has(key)) {
          path.push({ row: nr, col: nc });
          visited.add(key);
          moved = true;
          break;
        }
      }

      if (!moved) break; // dead end — restart
    }

    if (path.length === length) return path;
  }
  return null;
}

export interface GeneratedMaze {
  grid: MazeCell[][];
  targetSequence: MazeCell[];
}

export function generateGrid(round: number): GeneratedMaze {
  const targetLength = targetLengthForRound(round);
  const maxNum = maxNumForRound(round);
  const activeColors = COLOR_ORDER.slice(0, numColorsForRound(round));

  // Fill the grid with random noise first
  const grid: MazeCell[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      colorId: activeColors[randomInt(0, activeColors.length - 1)],
      num: randomInt(1, maxNum),
    })),
  );

  // Build the target sequence
  const targetSequence: MazeCell[] = Array.from({ length: targetLength }, () => ({
    colorId: activeColors[randomInt(0, activeColors.length - 1)],
    num: randomInt(1, maxNum),
  }));

  // Walk a path through the grid and stamp the target sequence onto it
  const startRow = randomInt(0, GRID_SIZE - 1);
  const startCol = randomInt(0, GRID_SIZE - 1);

  const path = walkPath(startRow, startCol, targetLength) ?? walkPath(0, 0, targetLength);

  if (path) {
    for (let i = 0; i < path.length; i++) {
      const { row, col } = path[i];
      grid[row][col] = { ...targetSequence[i] };
    }
  }

  return { grid, targetSequence };
}
