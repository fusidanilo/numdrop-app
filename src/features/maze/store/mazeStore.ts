import { create } from 'zustand';
import type { ColorId } from '@/game/config/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateGrid } from '@/features/maze/engine/gridGenerator';
import { computeTimeBonusMs, computeTimeCapMs } from '@/features/maze/config/pathDifficulty';

const MAZE_HIGH_SCORE_KEY = 'numdrop_maze_high_score';

export type MazeStatus = 'idle' | 'playing' | 'over';
export type PathStatus = 'idle' | 'tracing' | 'success' | 'fail';

export interface MazeCell {
  colorId: ColorId;
  num: number;
}

export interface PathStep {
  row: number;
  col: number;
}

const INITIAL_TIME_MS = 60_000;

interface MazeState {
  status: MazeStatus;
  grid: MazeCell[][];
  targetSequence: MazeCell[];
  currentPath: PathStep[];
  pathStatus: PathStatus;
  score: number;
  highScore: number;
  round: number;
  timeLeft: number;
  streak: number;
  /** In-game pause menu (timer and input frozen). */
  isPaused: boolean;

  startGame: () => void;
  beginRound: () => void;
  startPath: (step: PathStep | null) => void;
  extendPath: (step: PathStep | null) => void;
  submitPath: () => void;
  tick: (deltaMs: number) => void;
  setTimeOver: () => void;
  setPaused: (paused: boolean) => void;
  /** Back to ready screen; keeps highScore. Call when leaving Path for home or opening Path from home. */
  resetToIdle: () => void;
  loadHighScore: () => Promise<void>;
  /** __DEV__ only: jump to a round and regenerate the grid (timer set to that round's cap). */
  devJumpToRound: (targetRound: number) => void;
}

function makeEmptyGrid(): MazeCell[][] {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => ({ colorId: 'salmon' as ColorId, num: 1 })),
  );
}

export const useMazeStore = create<MazeState>((set, get) => ({
  status: 'idle',
  grid: makeEmptyGrid(),
  targetSequence: [],
  currentPath: [],
  pathStatus: 'idle',
  score: 0,
  highScore: 0,
  round: 0,
  timeLeft: INITIAL_TIME_MS,
  streak: 0,
  isPaused: false,

  startGame: () => {
    const { grid, targetSequence } = generateGrid(1);
    set({
      status: 'playing',
      grid,
      targetSequence,
      currentPath: [],
      pathStatus: 'idle',
      score: 0,
      round: 1,
      timeLeft: INITIAL_TIME_MS,
      streak: 0,
      isPaused: false,
    });
  },

  beginRound: () => {
    const nextRound = get().round + 1;
    const { grid, targetSequence } = generateGrid(nextRound);
    const cap = computeTimeCapMs(nextRound);
    const timeLeft = Math.min(get().timeLeft, cap);
    set({ round: nextRound, grid, targetSequence, currentPath: [], pathStatus: 'idle', timeLeft });
  },

  startPath: (step) => {
    if (get().pathStatus === 'success' || get().pathStatus === 'fail') return;
    if (!step) return;
    set({ currentPath: [step], pathStatus: 'tracing' });
  },

  extendPath: (step) => {
    if (!step || get().pathStatus !== 'tracing') return;
    const { currentPath } = get();
    if (currentPath.length === 0) return;

    const last = currentPath[currentPath.length - 1];
    const dr = Math.abs(step.row - last.row);
    const dc = Math.abs(step.col - last.col);
    const isAdjacent = dr + dc === 1;
    const alreadyInPath = currentPath.some((p) => p.row === step.row && p.col === step.col);

    if (!isAdjacent || alreadyInPath) return;

    set({ currentPath: [...currentPath, step] });
  },

  submitPath: () => {
    const { currentPath, grid, targetSequence, score, highScore, streak } = get();

    if (currentPath.length !== targetSequence.length) {
      set({ currentPath: [], pathStatus: 'fail', streak: 0 });
      setTimeout(() => set({ pathStatus: 'idle' }), 600);
      return;
    }

    const matches = currentPath.every(
      ({ row, col }, i) =>
        grid[row][col].colorId === targetSequence[i].colorId &&
        grid[row][col].num === targetSequence[i].num,
    );

    if (matches) {
      const newStreak = streak + 1;
      const bonusMultiplier = 1 + Math.floor(newStreak / 3) * 0.5;
      const roundPoints = Math.round(targetSequence.length * 100 * bonusMultiplier);
      const newScore = score + roundPoints;
      const newHighScore = newScore > highScore ? newScore : highScore;

      if (newScore > highScore) {
        AsyncStorage.setItem(MAZE_HIGH_SCORE_KEY, String(newScore)).catch(() => {});
      }

      const roundCompleted = get().round;
      const timeBonus = computeTimeBonusMs(roundCompleted, targetSequence.length);
      const timeCap = computeTimeCapMs(roundCompleted);

      set({
        pathStatus: 'success',
        score: newScore,
        highScore: newHighScore,
        streak: newStreak,
        timeLeft: Math.min(get().timeLeft + timeBonus, timeCap),
      });

      setTimeout(() => {
        get().beginRound();
      }, 500);
    } else {
      set({ currentPath: [], pathStatus: 'fail', streak: 0 });
      setTimeout(() => set({ pathStatus: 'idle' }), 600);
    }
  },

  tick: (deltaMs) => {
    const { timeLeft } = get();
    const newTime = timeLeft - deltaMs;
    if (newTime <= 0) {
      get().setTimeOver();
    } else {
      set({ timeLeft: newTime });
    }
  },

  setTimeOver: () => {
    const { score, highScore } = get();
    const newHighScore = score > highScore ? score : highScore;
    if (score > highScore) {
      AsyncStorage.setItem(MAZE_HIGH_SCORE_KEY, String(score)).catch(() => {});
    }
    set({ status: 'over', timeLeft: 0, highScore: newHighScore, isPaused: false });
  },

  setPaused: (paused) => set({ isPaused: paused }),

  resetToIdle: () =>
    set({
      status: 'idle',
      grid: makeEmptyGrid(),
      targetSequence: [],
      currentPath: [],
      pathStatus: 'idle',
      score: 0,
      round: 0,
      timeLeft: INITIAL_TIME_MS,
      streak: 0,
      isPaused: false,
    }),

  loadHighScore: async () => {
    try {
      const raw = await AsyncStorage.getItem(MAZE_HIGH_SCORE_KEY);
      if (raw) {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) set({ highScore: n });
      }
    } catch {
      // ignore
    }
  },

  devJumpToRound: (targetRound) => {
    if (!__DEV__) return;
    if (get().status !== 'playing') return;
    const r = Math.max(1, Math.floor(targetRound));
    const { grid, targetSequence } = generateGrid(r);
    const cap = computeTimeCapMs(r);
    set({
      round: r,
      grid,
      targetSequence,
      currentPath: [],
      pathStatus: 'idle',
      timeLeft: cap,
    });
  },
}));
