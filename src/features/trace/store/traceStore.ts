import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ColorId } from '@/game/config/colors';
import { generateFigure, countFigureCells, emptyFigureMask } from '@/features/trace/engine/figureGenerator';
import { computeTimeBonusMs, computeTimeCapMs } from '@/features/trace/config/traceDifficulty';

const TRACE_HIGH_SCORE_KEY = 'numdrop_trace_high_score';

const INITIAL_TIME_MS = 60_000;

let traceFailToIdleTimer: ReturnType<typeof setTimeout> | null = null;
let traceSuccessToNextRoundTimer: ReturnType<typeof setTimeout> | null = null;

function clearTracePathTimers() {
  if (traceFailToIdleTimer) {
    clearTimeout(traceFailToIdleTimer);
    traceFailToIdleTimer = null;
  }
  if (traceSuccessToNextRoundTimer) {
    clearTimeout(traceSuccessToNextRoundTimer);
    traceSuccessToNextRoundTimer = null;
  }
}
const IDLE_GRID_SIZE = 4;

export type TraceStatus = 'idle' | 'playing' | 'over';
export type TracePathStatus = 'idle' | 'tracing' | 'success' | 'fail';

export interface TracePathStep {
  row: number;
  col: number;
}

interface TraceState {
  status: TraceStatus;
  /** Side length of the square grid (4, 5, or 6 depending on round). */
  gridSize: number;
  figureMask: boolean[][];
  figureColorId: ColorId;
  expectedCellCount: number;
  currentPath: TracePathStep[];
  pathStatus: TracePathStatus;
  score: number;
  highScore: number;
  round: number;
  timeLeft: number;
  streak: number;
  isPaused: boolean;

  startGame: () => void;
  beginRound: () => void;
  startPath: (step: TracePathStep | null) => void;
  extendPath: (step: TracePathStep | null) => void;
  submitPath: () => void;
  tick: (deltaMs: number) => void;
  setTimeOver: () => void;
  setPaused: (paused: boolean) => void;
  resetToIdle: () => void;
  loadHighScore: () => Promise<void>;
  devJumpToRound: (targetRound: number) => void;
}

export const useTraceStore = create<TraceState>((set, get) => ({
  status: 'idle',
  gridSize: IDLE_GRID_SIZE,
  figureMask: emptyFigureMask(IDLE_GRID_SIZE),
  figureColorId: 'salmon',
  expectedCellCount: 0,
  currentPath: [],
  pathStatus: 'idle',
  score: 0,
  highScore: 0,
  round: 0,
  timeLeft: INITIAL_TIME_MS,
  streak: 0,
  isPaused: false,

  startGame: () => {
    clearTracePathTimers();
    const { figureMask, figureColorId, gridSize } = generateFigure(1);
    const expectedCellCount = countFigureCells(figureMask);
    set({
      status: 'playing',
      gridSize,
      figureMask,
      figureColorId,
      expectedCellCount,
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
    const { figureMask, figureColorId, gridSize } = generateFigure(nextRound);
    const expectedCellCount = countFigureCells(figureMask);
    const cap = computeTimeCapMs(nextRound);
    const timeLeft = Math.min(get().timeLeft, cap);
    set({
      round: nextRound,
      gridSize,
      figureMask,
      figureColorId,
      expectedCellCount,
      currentPath: [],
      pathStatus: 'idle',
      timeLeft,
    });
  },

  startPath: (step) => {
    if (!step) return;
    const ps = get().pathStatus;
    if (ps === 'fail') {
      if (traceFailToIdleTimer) {
        clearTimeout(traceFailToIdleTimer);
        traceFailToIdleTimer = null;
      }
      set({ pathStatus: 'idle' });
    } else if (ps === 'success') {
      if (traceSuccessToNextRoundTimer) {
        clearTimeout(traceSuccessToNextRoundTimer);
        traceSuccessToNextRoundTimer = null;
      }
      get().beginRound();
    } else if (ps !== 'idle' && ps !== 'tracing') {
      return;
    }
    const { figureMask } = get();
    if (!figureMask[step.row][step.col]) return;
    set({ currentPath: [step], pathStatus: 'tracing' });
  },

  extendPath: (step) => {
    if (!step || get().pathStatus !== 'tracing') return;
    const { currentPath, figureMask } = get();
    if (currentPath.length === 0) return;

    const last = currentPath[currentPath.length - 1];
    const dr = Math.abs(step.row - last.row);
    const dc = Math.abs(step.col - last.col);
    const isAdjacent = dr + dc === 1;
    const alreadyInPath = currentPath.some((p) => p.row === step.row && p.col === step.col);
    const isActive = figureMask[step.row][step.col];

    if (!isAdjacent || alreadyInPath || !isActive) return;

    set({ currentPath: [...currentPath, step] });
  },

  submitPath: () => {
    const { currentPath, figureMask, expectedCellCount, score, highScore, streak } = get();

    if (currentPath.length !== expectedCellCount) {
      if (traceFailToIdleTimer) {
        clearTimeout(traceFailToIdleTimer);
        traceFailToIdleTimer = null;
      }
      set({ currentPath: [], pathStatus: 'fail', streak: 0 });
      traceFailToIdleTimer = setTimeout(() => {
        traceFailToIdleTimer = null;
        set({ pathStatus: 'idle' });
      }, 600);
      return;
    }

    const key = (p: TracePathStep) => `${p.row},${p.col}`;
    const visited = new Set(currentPath.map(key));
    if (visited.size !== expectedCellCount) {
      if (traceFailToIdleTimer) {
        clearTimeout(traceFailToIdleTimer);
        traceFailToIdleTimer = null;
      }
      set({ currentPath: [], pathStatus: 'fail', streak: 0 });
      traceFailToIdleTimer = setTimeout(() => {
        traceFailToIdleTimer = null;
        set({ pathStatus: 'idle' });
      }, 600);
      return;
    }

    for (const p of currentPath) {
      if (!figureMask[p.row][p.col]) {
        if (traceFailToIdleTimer) {
          clearTimeout(traceFailToIdleTimer);
          traceFailToIdleTimer = null;
        }
        set({ currentPath: [], pathStatus: 'fail', streak: 0 });
        traceFailToIdleTimer = setTimeout(() => {
          traceFailToIdleTimer = null;
          set({ pathStatus: 'idle' });
        }, 600);
        return;
      }
    }

    const newStreak = streak + 1;
    const bonusMultiplier = 1 + Math.floor(newStreak / 3) * 0.5;
    const roundPoints = Math.round(expectedCellCount * 100 * bonusMultiplier);
    const newScore = score + roundPoints;
    const newHighScore = newScore > highScore ? newScore : highScore;

    if (newScore > highScore) {
      AsyncStorage.setItem(TRACE_HIGH_SCORE_KEY, String(newScore)).catch(() => {});
    }

    const roundCompleted = get().round;
    const timeBonus = computeTimeBonusMs(roundCompleted, expectedCellCount);
    const timeCap = computeTimeCapMs(roundCompleted);

    if (traceSuccessToNextRoundTimer) {
      clearTimeout(traceSuccessToNextRoundTimer);
      traceSuccessToNextRoundTimer = null;
    }
    if (traceFailToIdleTimer) {
      clearTimeout(traceFailToIdleTimer);
      traceFailToIdleTimer = null;
    }

    set({
      pathStatus: 'success',
      score: newScore,
      highScore: newHighScore,
      streak: newStreak,
      timeLeft: Math.min(get().timeLeft + timeBonus, timeCap),
    });

    traceSuccessToNextRoundTimer = setTimeout(() => {
      traceSuccessToNextRoundTimer = null;
      get().beginRound();
    }, 500);
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
    clearTracePathTimers();
    const { score, highScore } = get();
    const newHighScore = score > highScore ? score : highScore;
    if (score > highScore) {
      AsyncStorage.setItem(TRACE_HIGH_SCORE_KEY, String(score)).catch(() => {});
    }
    set({ status: 'over', timeLeft: 0, highScore: newHighScore, isPaused: false });
  },

  setPaused: (paused) => set({ isPaused: paused }),

  resetToIdle: () => {
    clearTracePathTimers();
    set({
      status: 'idle',
      gridSize: IDLE_GRID_SIZE,
      figureMask: emptyFigureMask(IDLE_GRID_SIZE),
      figureColorId: 'salmon',
      expectedCellCount: 0,
      currentPath: [],
      pathStatus: 'idle',
      score: 0,
      round: 0,
      timeLeft: INITIAL_TIME_MS,
      streak: 0,
      isPaused: false,
    });
  },

  loadHighScore: async () => {
    try {
      const raw = await AsyncStorage.getItem(TRACE_HIGH_SCORE_KEY);
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
    clearTracePathTimers();
    const r = Math.max(1, Math.floor(targetRound));
    const { figureMask, figureColorId, gridSize } = generateFigure(r);
    const expectedCellCount = countFigureCells(figureMask);
    const cap = computeTimeCapMs(r);
    set({
      round: r,
      gridSize,
      figureMask,
      figureColorId,
      expectedCellCount,
      currentPath: [],
      pathStatus: 'idle',
      timeLeft: cap,
    });
  },
}));
