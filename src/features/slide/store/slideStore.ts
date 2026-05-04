import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  shuffleBoard,
  applyMove,
  isSolved,
  legalMoves,
  solvedBoard,
} from '@/features/slide/engine/slidePuzzle';
import type { Board } from '@/features/slide/engine/slidePuzzle';
import {
  SLIDE_GRID_SIZE,
  shuffleMovesForRound,
  moveBudgetForRound,
  CHECKPOINT_EVERY,
} from '@/features/slide/config/slideCampaign';

const ENDLESS_KEY = 'numdrop_slide_endless_v1';

export type SlideStatus = 'idle' | 'playing' | 'won' | 'lost';

export type SlideLastResult = null | 'won' | 'lost';

interface EndlessPersisted {
  bestRoundEver: number;
  /** Last round where a checkpoint was reached; used to resume from the ready screen. */
  savedCheckpointRound?: number;
}

interface SlideState {
  status: SlideStatus;
  board: Board;
  elapsedMs: number;
  moves: number;
  isPaused: boolean;
  moveBudget: number;
  lastResult: SlideLastResult;

  round: number;
  lastCheckpointRound: number;
  bestRoundEver: number;
  winWasNewRoundRecord: boolean;
  /** 1 = first attempt this round; 2 = after free retry; 3 = after rewarded retry. */
  roundTryIndex: 1 | 2 | 3;
  /** Highest checkpoint round persisted across sessions (0 = none). */
  savedCheckpointRound: number;

  startRun: () => void;
  startFromSavedCheckpoint: () => void;
  advanceAfterWin: () => void;
  retryAfterLoss: () => void;
  retryAfterRewardedAd: () => void;
  respawnFromCheckpoint: () => void;
  restartCurrentRound: () => void;
  restartFullRun: () => void;

  tryTapCell: (tileIndex: number) => void;
  tick: (deltaMs: number) => void;
  setPaused: (paused: boolean) => void;
  resetToIdle: () => void;
  loadEndless: () => Promise<void>;
}

function persistEndless(bestRoundEver: number, savedCheckpointRound: number) {
  const data: EndlessPersisted = { bestRoundEver, savedCheckpointRound };
  AsyncStorage.setItem(ENDLESS_KEY, JSON.stringify(data)).catch(() => {});
}

function dealPlayingRound(
  set: (partial: Partial<SlideState>) => void,
  round: number,
  roundTryIndex: 1 | 2 | 3,
  extra?: Pick<SlideState, 'lastCheckpointRound'>,
) {
  const k = SLIDE_GRID_SIZE;
  const board = shuffleBoard(k, shuffleMovesForRound(round));
  set({
    status: 'playing',
    board,
    round,
    roundTryIndex,
    elapsedMs: 0,
    moves: 0,
    isPaused: false,
    moveBudget: moveBudgetForRound(round),
    lastResult: null,
    winWasNewRoundRecord: false,
    ...extra,
  });
}

export const useSlideStore = create<SlideState>((set, get) => ({
  status: 'idle',
  board: solvedBoard(SLIDE_GRID_SIZE),
  elapsedMs: 0,
  moves: 0,
  isPaused: false,
  moveBudget: moveBudgetForRound(1),
  lastResult: null,

  round: 1,
  lastCheckpointRound: 0,
  bestRoundEver: 0,
  winWasNewRoundRecord: false,
  roundTryIndex: 1,
  savedCheckpointRound: 0,

  startRun: () => {
    dealPlayingRound(set, 1, 1, { lastCheckpointRound: 0 });
  },

  startFromSavedCheckpoint: () => {
    const saved = get().savedCheckpointRound;
    if (saved < 1) return;
    const nextRound = Math.max(1, saved + 1);
    dealPlayingRound(set, nextRound, 1, { lastCheckpointRound: saved });
  },

  advanceAfterWin: () => {
    const { round, lastCheckpointRound, bestRoundEver } = get();
    const best = Math.max(bestRoundEver, round);
    if (best > bestRoundEver) {
      persistEndless(best, get().savedCheckpointRound);
    }
    const nextRound = round + 1;
    const k = SLIDE_GRID_SIZE;
    const board = shuffleBoard(k, shuffleMovesForRound(nextRound));
    set({
      status: 'playing',
      board,
      round: nextRound,
      roundTryIndex: 1,
      elapsedMs: 0,
      moves: 0,
      isPaused: false,
      moveBudget: moveBudgetForRound(nextRound),
      lastResult: null,
      lastCheckpointRound,
      bestRoundEver: best,
      winWasNewRoundRecord: false,
    });
  },

  retryAfterLoss: () => {
    dealPlayingRound(set, get().round, 2);
  },

  retryAfterRewardedAd: () => {
    dealPlayingRound(set, get().round, 3);
  },

  respawnFromCheckpoint: () => {
    const nextRound = Math.max(1, get().lastCheckpointRound + 1);
    dealPlayingRound(set, nextRound, 1);
  },

  restartCurrentRound: () => {
    dealPlayingRound(set, get().round, 1);
  },

  restartFullRun: () => {
    const best = get().bestRoundEver;
    persistEndless(best, 0);
    set({ savedCheckpointRound: 0 });
    dealPlayingRound(set, 1, 1, { lastCheckpointRound: 0 });
  },

  tryTapCell: (tileIndex) => {
    const { status, board, moves, isPaused, moveBudget } = get();
    if (status !== 'playing' || isPaused) return;

    const legal = legalMoves(board, SLIDE_GRID_SIZE);
    if (!legal.includes(tileIndex)) return;

    const nextBoard = applyMove(board, tileIndex);
    const nextMoves = moves + 1;

    if (isSolved(nextBoard)) {
      const { round: r, lastCheckpointRound: prevCp, bestRoundEver: prevBest, savedCheckpointRound: prevSaved } =
        get();
      let cp = prevCp;
      if (r % CHECKPOINT_EVERY === 0) {
        cp = r;
      }
      const best = Math.max(prevBest, r);
      const nextSaved = Math.max(prevSaved, cp);
      persistEndless(best, nextSaved);
      set({
        board: nextBoard,
        moves: nextMoves,
        status: 'won',
        lastResult: 'won',
        lastCheckpointRound: cp,
        bestRoundEver: best,
        savedCheckpointRound: nextSaved,
        winWasNewRoundRecord: best > prevBest,
      });
    } else if (nextMoves >= moveBudget) {
      set({
        board: nextBoard,
        moves: nextMoves,
        status: 'lost',
        lastResult: 'lost',
      });
    } else {
      set({ board: nextBoard, moves: nextMoves });
    }
  },

  tick: (deltaMs) => {
    const { status, isPaused } = get();
    if (status !== 'playing' || isPaused) return;
    set((s) => ({ elapsedMs: s.elapsedMs + deltaMs }));
  },

  setPaused: (paused) => set({ isPaused: paused }),

  resetToIdle: () =>
    set({
      status: 'idle',
      board: solvedBoard(SLIDE_GRID_SIZE),
      elapsedMs: 0,
      moves: 0,
      isPaused: false,
      lastResult: null,
      moveBudget: moveBudgetForRound(1),
      round: 1,
      roundTryIndex: 1,
      lastCheckpointRound: 0,
      winWasNewRoundRecord: false,
    }),

  loadEndless: async () => {
    try {
      const raw = await AsyncStorage.getItem(ENDLESS_KEY);
      if (raw) {
        const data = JSON.parse(raw) as EndlessPersisted;
        const best = Math.max(0, Math.floor(data.bestRoundEver ?? 0));
        const saved = Math.max(0, Math.floor(data.savedCheckpointRound ?? 0));
        set({ bestRoundEver: best, savedCheckpointRound: saved });
      }
    } catch {
      // ignore
    }
  },
}));
