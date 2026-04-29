import { create } from 'zustand';
import type { ColorId } from '@/game/config/colors';
import { COLOR_ORDER } from '@/game/config/colors';

export type GameStatus = 'idle' | 'playing' | 'over';

function makeInitialNext(): Record<ColorId, number> {
  return Object.fromEntries(COLOR_ORDER.map((c) => [c, 1])) as Record<ColorId, number>;
}

interface GameState {
  status: GameStatus;
  /** True while the in-game pause menu is open — no spawns / life loss from exits. */
  isPaused: boolean;
  /** Incremented on each startGame so the loop resets even if status stays `playing`. */
  gameSessionId: number;
  lives: number;
  score: number;
  combo: number;
  tier: number;
  nextByColor: Record<ColorId, number>;
  highScore: number;

  startGame: () => void;
  /**
   * Called when a tile is tapped correctly.
   * Advances the chain counter for that colour, increases combo and score.
   */
  tapHit: (colorId: ColorId) => void;
  /**
   * Called when a tile is tapped but the number is wrong.
   * Resets the chain for that colour and kills the combo.
   */
  tapMiss: (colorId: ColorId) => void;
  /**
   * Called when the required tile for a colour exits the screen without being tapped.
   * Costs a life and resets the chain.
   */
  loseLife: (colorId: ColorId) => void;
  setTier: (tier: number) => void;
  setHighScore: (score: number) => void;
  /** Abandon mid-run (e.g. user left the game screen) — fresh session next time. */
  resetSessionIdle: () => void;
  setPaused: (paused: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  status: 'idle',
  isPaused: false,
  gameSessionId: 0,
  lives: 3,
  score: 0,
  combo: 1,
  tier: 0,
  nextByColor: makeInitialNext(),
  highScore: 0,

  startGame: () =>
    set((s) => ({
      status: 'playing',
      isPaused: false,
      gameSessionId: s.gameSessionId + 1,
      lives: 3,
      score: 0,
      combo: 1,
      tier: 0,
      nextByColor: makeInitialNext(),
    })),

  tapHit: (colorId) => {
    const { combo, score, nextByColor } = get();
    const newNext = { ...nextByColor };
    newNext[colorId] = newNext[colorId] >= 9 ? 1 : newNext[colorId] + 1;
    const points = 10 * combo;
    set({ score: score + points, combo: combo + 1, nextByColor: newNext });
  },

  tapMiss: (colorId) => {
    const { nextByColor } = get();
    set({ combo: 1, nextByColor: { ...nextByColor, [colorId]: 1 } });
  },

  loseLife: (colorId) => {
    const { lives, nextByColor } = get();
    const newLives = lives - 1;
    const newNext = { ...nextByColor, [colorId]: 1 };
    if (newLives <= 0) {
      set({ lives: 0, nextByColor: newNext, combo: 1, status: 'over', isPaused: false });
    } else {
      set({ lives: newLives, nextByColor: newNext, combo: 1 });
    }
  },

  setTier: (tier) => {
    if (get().tier !== tier) set({ tier });
  },

  setHighScore: (score) => set({ highScore: score }),

  resetSessionIdle: () =>
    set({
      status: 'idle',
      isPaused: false,
      lives: 3,
      score: 0,
      combo: 1,
      tier: 0,
      nextByColor: makeInitialNext(),
    }),

  setPaused: (paused) => set({ isPaused: paused }),
}));
