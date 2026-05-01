import { create } from 'zustand';
import type { ColorId } from '@/game/config/colors';
import { COLOR_ORDER } from '@/game/config/colors';
import { isDevGameMode } from '@/game/config/devGame';

export type GameStatus = 'idle' | 'playing' | 'over';

export interface PowerUps {
  freeze: number;
  shield: number;
  /** Bomba: rimuove tutte le tile sullo schermo (nessuna vita persa). */
  bomb: number;
}

export interface ActiveEffect {
  type: 'freeze';
  expiresAt: number;
}

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

  /** Current tier's max chain number (1–maxNum → wraps). Updated by the loop. */
  currentMaxNum: number;
  /** Current tier's base score per tap (multiplied by combo). Updated by the loop. */
  currentBasePoints: number;

  powerUps: PowerUps;
  /** True while a previously-activated shield is waiting to absorb a life loss. */
  shieldActive: boolean;
  /** Solo freeze (timed). La bomba è istantanea e usa clearBoardNonce. */
  activeEffect: ActiveEffect | null;
  /** Il loop consuma questo nonce per svuotare il campo (bomba power-up). */
  clearBoardNonce: number;

  startGame: () => void;
  /**
   * Called when a tile is tapped correctly.
   * isDouble: true for double-kind tiles (advance chain by 2).
   */
  tapHit: (colorId: ColorId, isDouble?: boolean) => void;
  /** Called when a tile is tapped but the number is wrong. */
  tapMiss: (colorId: ColorId) => void;
  /**
   * Called when the required tile for a colour exits without being tapped (or a bomb explodes).
   * Costs a life (unless a shield is active) and resets the chain.
   */
  loseLife: (colorId: ColorId) => void;
  /** Add a life from a bonus tile (capped at 5). */
  gainLife: () => void;
  setTier: (tier: number) => void;
  /** Called by the loop whenever the tier changes. */
  setTierMetrics: (maxNum: number, basePoints: number) => void;
  setHighScore: (score: number) => void;
  resetSessionIdle: () => void;
  setPaused: (paused: boolean) => void;
  /** Spend one charge of a power-up and activate it. */
  activatePowerUp: (type: keyof PowerUps) => void;
  /** Clear an expired timed effect (called by the loop). */
  clearActiveEffect: () => void;
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
  currentMaxNum: 9,
  currentBasePoints: 10,
  powerUps: { freeze: 0, shield: 0, bomb: 0 },
  shieldActive: false,
  activeEffect: null,
  clearBoardNonce: 0,

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
      currentMaxNum: 9,
      currentBasePoints: 10,
      powerUps: isDevGameMode()
        ? { freeze: 3, shield: 3, bomb: 3 }
        : { freeze: 0, shield: 0, bomb: 0 },
      shieldActive: false,
      activeEffect: null,
      clearBoardNonce: 0,
    })),

  tapHit: (colorId, isDouble = false) => {
    const { combo, score, nextByColor, currentMaxNum, currentBasePoints, powerUps } = get();
    const newNext = { ...nextByColor };
    const advancement = isDouble ? 2 : 1;
    // Wrap within 1…currentMaxNum
    newNext[colorId] = ((newNext[colorId] - 1 + advancement) % currentMaxNum) + 1;
    const points = currentBasePoints * combo;
    const newCombo = combo + 1;

    const updates: Partial<GameState> = {
      combo: newCombo,
      nextByColor: newNext,
      ...(isDevGameMode() ? {} : { score: score + points }),
    };

    // Sandbox: milestone ogni 5 hit + cariche piene all'avvio; gioco normale: ogni 10
    const powerUpMilestone = isDevGameMode() ? 5 : 10;
    if (newCombo % powerUpMilestone === 0) {
      const types: Array<keyof PowerUps> = ['freeze', 'shield', 'bomb'];
      const type = types[Math.floor(Math.random() * types.length)];
      updates.powerUps = { ...powerUps, [type]: Math.min(3, powerUps[type] + 1) };
    }

    set(updates);
  },

  tapMiss: (colorId) => {
    const { nextByColor } = get();
    set({ combo: 1, nextByColor: { ...nextByColor, [colorId]: 1 } });
  },

  loseLife: (colorId) => {
    const { lives, nextByColor, shieldActive } = get();
    const newNext = { ...nextByColor, [colorId]: 1 };

    if (isDevGameMode()) {
      set({ shieldActive: false, nextByColor: newNext, combo: 1 });
      return;
    }

    if (shieldActive) {
      set({ shieldActive: false, nextByColor: newNext, combo: 1 });
      return;
    }

    const newLives = lives - 1;
    if (newLives <= 0) {
      set({ lives: 0, nextByColor: newNext, combo: 1, status: 'over', isPaused: false });
    } else {
      set({ lives: newLives, nextByColor: newNext, combo: 1 });
    }
  },

  gainLife: () => {
    if (isDevGameMode()) return;
    const { lives } = get();
    set({ lives: Math.min(5, lives + 1) });
  },

  setTier: (tier) => {
    if (get().tier !== tier) set({ tier });
  },

  setTierMetrics: (maxNum, basePoints) => {
    const s = get();
    if (s.currentMaxNum !== maxNum || s.currentBasePoints !== basePoints) {
      set({ currentMaxNum: maxNum, currentBasePoints: basePoints });
    }
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
      currentMaxNum: 9,
      currentBasePoints: 10,
      powerUps: { freeze: 0, shield: 0, bomb: 0 },
      shieldActive: false,
      activeEffect: null,
      clearBoardNonce: 0,
    }),

  setPaused: (paused) => set({ isPaused: paused }),

  activatePowerUp: (type) => {
    const { powerUps, activeEffect, shieldActive } = get();
    if (powerUps[type] <= 0) return;

    if (type === 'bomb') {
      set((s) => ({
        powerUps: { ...s.powerUps, bomb: s.powerUps.bomb - 1 },
        clearBoardNonce: s.clearBoardNonce + 1,
      }));
      return;
    }

    const now = Date.now();
    if (type === 'freeze') {
      if (activeEffect?.type === 'freeze' && activeEffect.expiresAt > now) return;
    }
    if (type === 'shield' && shieldActive) return;

    const updates: Partial<GameState> = {
      powerUps: { ...powerUps, [type]: powerUps[type] - 1 },
    };

    if (type === 'shield') {
      updates.shieldActive = true;
    } else if (type === 'freeze') {
      updates.activeEffect = { type: 'freeze', expiresAt: now + 5000 };
    }

    set(updates);
  },

  clearActiveEffect: () => set({ activeEffect: null }),
}));
