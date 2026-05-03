import type { ColorId } from '@/game/config/colors';
import { COLOR_ORDER } from '@/game/config/colors';
import { cellCountForRound, traceGridSizeForRound } from '@/features/trace/config/traceGridConfig';

const DIRECTIONS = [
  { dr: -1, dc: 0 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
  { dr: 0, dc: 1 },
];

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

export function emptyFigureMask(gridSize: number): boolean[][] {
  return Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => false));
}

/**
 * Random self-avoiding walk of exact `length` cells on a `gridSize`×`gridSize` grid.
 */
function walkFigurePath(
  gridSize: number,
  startRow: number,
  startCol: number,
  length: number,
  maxAttempts: number,
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
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && !visited.has(key)) {
          path.push({ row: nr, col: nc });
          visited.add(key);
          moved = true;
          break;
        }
      }

      if (!moved) break;
    }

    if (path.length === length) return path;
  }
  return null;
}

function maskFromPath(
  gridSize: number,
  path: Array<{ row: number; col: number }>,
): boolean[][] {
  const mask = emptyFigureMask(gridSize);
  for (const { row, col } of path) {
    mask[row][col] = true;
  }
  return mask;
}

/** Boustrophedon snake: always a valid connected path of `target` cells. */
function fallbackSnakePath(gridSize: number, target: number): Array<{ row: number; col: number }> {
  const path: Array<{ row: number; col: number }> = [];
  const n = Math.min(Math.max(4, target), gridSize * gridSize);
  let k = 0;
  outer: for (let r = 0; r < gridSize; r++) {
    const cols = Array.from({ length: gridSize }, (_, c) => c);
    if (r % 2 === 1) cols.reverse();
    for (const c of cols) {
      path.push({ row: r, col: c });
      k++;
      if (k >= n) break outer;
    }
  }
  return path;
}

function attemptsPerWalkStart(length: number, gridSize: number): number {
  return Math.min(2200, 180 + length * 42 + gridSize * gridSize * 14);
}

function globalAttemptsBudget(targetLen: number, gridSize: number): number {
  return 9000 + gridSize * 3200 + targetLen * 220;
}

export interface GeneratedFigure {
  figureMask: boolean[][];
  gridSize: number;
  /** Number of cells in the figure (equals path length used to build it). */
  cellCount: number;
  figureColorId: ColorId;
}

/**
 * Builds a connected “figure” as the cells of a random self-avoiding path:
 * the player must visit every highlighted cell exactly once in one stroke.
 */
export function generateFigure(round: number): GeneratedFigure {
  const gridSize = traceGridSizeForRound(round);
  const targetLen = cellCountForRound(round, gridSize);
  const figureColorId = COLOR_ORDER[(round - 1) % COLOR_ORDER.length] as ColorId;

  const minLen = gridSize === 4 ? 4 : gridSize === 5 ? 6 : 8;

  const tryLen = (len: number): GeneratedFigure | null => {
    const perStart = attemptsPerWalkStart(len, gridSize);
    const globalMax = globalAttemptsBudget(len, gridSize);
    let tries = 0;
    while (tries < globalMax) {
      tries++;
      const sr = randomInt(0, gridSize - 1);
      const sc = randomInt(0, gridSize - 1);
      const path = walkFigurePath(gridSize, sr, sc, len, perStart);
      if (path) {
        return {
          figureMask: maskFromPath(gridSize, path),
          gridSize,
          cellCount: len,
          figureColorId,
        };
      }
    }
    return null;
  };

  for (let len = targetLen; len >= minLen; len--) {
    const g = tryLen(len);
    if (g) return g;
  }

  const fb = fallbackSnakePath(gridSize, Math.max(minLen, Math.min(targetLen, gridSize * gridSize)));
  return {
    figureMask: maskFromPath(gridSize, fb),
    gridSize,
    cellCount: fb.length,
    figureColorId,
  };
}

export function countFigureCells(mask: boolean[][]): number {
  const n = mask.length;
  let count = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (mask[r][c]) count++;
    }
  }
  return count;
}
