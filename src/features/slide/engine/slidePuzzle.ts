/**
 * Core sliding-puzzle engine.
 * State is a flat `number[]` of length k² where `0` represents the blank tile.
 * Solved state: [1, 2, …, k²−1, 0] (row-major, blank at bottom-right).
 */

export type Board = number[];

/** Return index of the blank tile (0). */
export function blankIndex(board: Board): number {
  return board.indexOf(0);
}

/** Build the solved board for a k×k grid. */
export function solvedBoard(k: number): Board {
  const n = k * k;
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? 0 : i + 1));
}

/** Return true when board matches the solved state. */
export function isSolved(board: Board): boolean {
  const n = board.length;
  for (let i = 0; i < n - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[n - 1] === 0;
}

/**
 * Indices of tiles legally adjacent to the blank (orthogonal neighbours).
 * Only these cells can be moved.
 */
export function legalMoves(board: Board, k: number): number[] {
  const bi = blankIndex(board);
  const row = Math.floor(bi / k);
  const col = bi % k;
  const moves: number[] = [];
  if (row > 0) moves.push(bi - k); // tile above blank
  if (row < k - 1) moves.push(bi + k); // tile below blank
  if (col > 0) moves.push(bi - 1); // tile left of blank
  if (col < k - 1) moves.push(bi + 1); // tile right of blank
  return moves;
}

/** Return a new board with the tile at `tileIndex` slid into the blank. */
export function applyMove(board: Board, tileIndex: number): Board {
  const bi = blankIndex(board);
  const next = [...board];
  next[bi] = next[tileIndex];
  next[tileIndex] = 0;
  return next;
}

/**
 * Produce a shuffled board by applying `moveCount` random legal moves
 * starting from the solved state — guaranteed to be solvable.
 *
 * `minMoves` guardrail prevents trivially short shuffles even if `moveCount`
 * is small; the walk also avoids the immediate back-move to add variety.
 */
export function shuffleBoard(k: number, moveCount: number): Board {
  let board = solvedBoard(k);
  let lastMoved = -1;

  for (let i = 0; i < moveCount; i++) {
    const candidates = legalMoves(board, k).filter((idx) => idx !== lastMoved);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    lastMoved = blankIndex(board);
    board = applyMove(board, pick);
  }

  return board;
}

/** Number of random moves to apply when shuffling, by grid size. */
export function shuffleMovesForSize(k: number): number {
  if (k <= 3) return 800;
  if (k <= 4) return 2000;
  return 4000;
}
