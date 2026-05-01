/**
 * Game loop — performance architecture
 *
 * Problem: running setTiles() at 60 fps (every 16 ms) causes React re-renders
 * for every frame, which collides with tap-handler updates and produces jank.
 *
 * Solution:
 *  • Each tile's Y position lives in a Reanimated SharedValue (UI thread).
 *    withTiming(EXIT_Y, { easing: linear }) drives the fall entirely on the UI
 *    thread — no JS involvement, no frame-drops on tap.
 *  • The JS setInterval only runs at ~50 ms (20 fps) and handles:
 *      – spawning new tiles
 *      – tier progression (speed changes)
 *      – exit detection (via the withTiming finish callback)
 *      – bomb midscreen detection
 *      – active effect (freeze) + screen-clear bomb power-up
 *  • setTiles() is called only when tiles are ADDED or REMOVED, i.e. ~1x per
 *    second, not 60x per second.
 */
import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import {
  makeMutable,
  withTiming,
  cancelAnimation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { TileData } from '@/game/engine/spawner';
import { spawnTile, resetSpawnerCounter } from '@/game/engine/spawner';
import { getTierConfig, getTierIndex } from '@/game/config/levels';
import type { ColorId } from '@/game/config/colors';
import { useGameStore } from '@/game/store/gameStore';

export const TILE_RADIUS = 28;
/** How often the JS loop fires (only for spawn/tier, not position updates) */
const LOGIC_MS = 50;

export interface UseGameLoopReturn {
  /** Ref to the Map of Reanimated Y shared values, keyed by tile id */
  tileYAnims: MutableRefObject<Map<string, SharedValue<number>>>;
  removeTile: (id: string) => void;
  markTile: (id: string, status: TileData['status']) => void;
  clearBoardForPause: () => void;
}

export function useGameLoop({
  screenWidth,
  screenHeight,
  onTilesChange,
  onBombExplode,
}: {
  screenWidth: number;
  screenHeight: number;
  onTilesChange: (tiles: TileData[]) => void;
  onBombExplode?: () => void;
}): UseGameLoopReturn {
  const tilesRef = useRef<TileData[]>([]);
  const yAnimsRef = useRef<Map<string, SharedValue<number>>>(new Map());
  const startTimeRef = useRef(0);
  const pausedTotalMsRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const animationsPausedRef = useRef(false);
  const lastSpawnRef = useRef(0);
  const prevTierRef = useRef(-1);
  const prevEffectiveFallRef = useRef(0);
  const prevClearBoardNonceRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const EXIT_Y = screenHeight + TILE_RADIUS;

  const status = useGameStore((s) => s.status);
  const gameSessionId = useGameStore((s) => s.gameSessionId);

  // ── Publish tile metadata to React state (no y needed) ──────────────────
  const publishTiles = useCallback(() => {
    onTilesChange([...tilesRef.current]);
  }, [onTilesChange]);

  // ── Called (via runOnJS) when a tile's fall animation completes ───────────
  const handleTileExit = useCallback(
    (id: string, colorId: string, num: number) => {
      const { nextByColor, loseLife, isPaused } = useGameStore.getState();
      // Bonus tiles (num === 0) never cost a life; bomb tiles are handled earlier
      if (!isPaused && num !== 0 && num === nextByColor[colorId as ColorId]) {
        loseLife(colorId as ColorId);
      }
      yAnimsRef.current.delete(id);
      tilesRef.current = tilesRef.current.filter((t) => t.id !== id);
      publishTiles();
    },
    [publishTiles],
  );

  // ── Start the Reanimated fall animation for a newly spawned tile ──────────
  const startFallAnim = useCallback(
    (tile: TileData, fallDuration: number) => {
      const yAnim = makeMutable<number>(-TILE_RADIUS);
      yAnimsRef.current.set(tile.id, yAnim);

      const totalTravel = EXIT_Y - (-TILE_RADIUS);
      const remainingTravel = EXIT_Y - (-TILE_RADIUS); // starts at top
      const duration = (remainingTravel / totalTravel) * fallDuration;

      const tileId = tile.id;
      const colorId = tile.colorId;
      const num = tile.num;
      const onExit = handleTileExit;

      yAnim.value = withTiming(EXIT_Y, { duration, easing: Easing.linear }, (finished) => {
        'worklet';
        if (finished) runOnJS(onExit)(tileId, colorId, num);
      });
    },
    [EXIT_Y, handleTileExit],
  );

  // ── Restart animations with updated speed on tier change or effect ────────
  const updateFallSpeeds = useCallback(
    (newFallDuration: number) => {
      for (const tile of tilesRef.current) {
        if (tile.status !== 'falling') continue;
        const yAnim = yAnimsRef.current.get(tile.id);
        if (!yAnim) continue;

        const currentY = yAnim.value;
        const remaining = EXIT_Y - currentY;
        if (remaining <= 0) continue;

        const totalTravel = EXIT_Y - (-TILE_RADIUS);
        const newDuration = (remaining / totalTravel) * newFallDuration;

        cancelAnimation(yAnim);

        const tileId = tile.id;
        const colorId = tile.colorId;
        const num = tile.num;
        const onExit = handleTileExit;

        yAnim.value = withTiming(
          EXIT_Y,
          { duration: newDuration, easing: Easing.linear },
          (finished) => {
            'worklet';
            if (finished) runOnJS(onExit)(tileId, colorId, num);
          },
        );
      }
    },
    [EXIT_Y, handleTileExit],
  );

  // ── Pause/resume falling tiles without clearing the board ────────────────
  const pauseFallingAnimations = useCallback(() => {
    for (const tile of tilesRef.current) {
      if (tile.status !== 'falling') continue;
      const yAnim = yAnimsRef.current.get(tile.id);
      if (yAnim) cancelAnimation(yAnim);
    }
  }, []);

  const resumeFallingAnimations = useCallback(
    (newFallDuration: number) => {
      for (const tile of tilesRef.current) {
        if (tile.status !== 'falling') continue;
        const yAnim = yAnimsRef.current.get(tile.id);
        if (!yAnim) continue;

        const currentY = yAnim.value;
        const remaining = EXIT_Y - currentY;
        if (remaining <= 0) continue;

        const totalTravel = EXIT_Y - (-TILE_RADIUS);
        const resumedDuration = (remaining / totalTravel) * newFallDuration;

        const tileId = tile.id;
        const colorId = tile.colorId;
        const num = tile.num;
        const onExit = handleTileExit;

        yAnim.value = withTiming(
          EXIT_Y,
          { duration: resumedDuration, easing: Easing.linear },
          (finished) => {
            'worklet';
            if (finished) runOnJS(onExit)(tileId, colorId, num);
          },
        );
      }
    },
    [EXIT_Y, handleTileExit],
  );

  // ── Main effect: start/stop the logic interval ────────────────────────────
  useEffect(() => {
    if (status !== 'playing') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      pauseStartedAtRef.current = null;
      pausedTotalMsRef.current = 0;
      animationsPausedRef.current = false;
      if (status === 'idle') {
        for (const a of yAnimsRef.current.values()) cancelAnimation(a);
        yAnimsRef.current.clear();
        tilesRef.current = [];
        onTilesChange([]);
      }
      return;
    }

    resetSpawnerCounter();
    for (const a of yAnimsRef.current.values()) cancelAnimation(a);
    yAnimsRef.current.clear();
    tilesRef.current = [];
    onTilesChange([]);
    prevTierRef.current = -1;
    prevEffectiveFallRef.current = 0;
    prevClearBoardNonceRef.current = useGameStore.getState().clearBoardNonce;

    const now = Date.now();
    startTimeRef.current = now;
    pausedTotalMsRef.current = 0;
    pauseStartedAtRef.current = null;
    animationsPausedRef.current = false;
    lastSpawnRef.current = now - 9999; // trigger immediate first spawn

    intervalRef.current = setInterval(() => {
      const ts = Date.now();
      const {
        setTier,
        setTierMetrics,
        clearActiveEffect,
        loseLife,
        status: currentStatus,
        isPaused,
        activeEffect,
      } = useGameStore.getState();

      if (currentStatus !== 'playing') return;

      if (isPaused) {
        if (pauseStartedAtRef.current === null) {
          pauseStartedAtRef.current = ts;
        }
        if (!animationsPausedRef.current) {
          pauseFallingAnimations();
          animationsPausedRef.current = true;
        }
        return;
      }

      if (pauseStartedAtRef.current !== null) {
        pausedTotalMsRef.current += ts - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
      }

      const elapsed = ts - startTimeRef.current - pausedTotalMsRef.current;
      const tierIdx = getTierIndex(elapsed);
      setTier(tierIdx);
      const cfg = getTierConfig(elapsed);
      setTierMetrics(cfg.maxNum, cfg.basePoints);

      // ── Bomba power-up: svuota il campo (nessuna vita/combo persi; animazioni annullate senza exit callback)
      const clearTarget = useGameStore.getState().clearBoardNonce;
      while (prevClearBoardNonceRef.current < clearTarget) {
        prevClearBoardNonceRef.current++;
        for (const a of yAnimsRef.current.values()) cancelAnimation(a);
        yAnimsRef.current.clear();
        tilesRef.current = [];
        publishTiles();
      }

      // ── Freeze: quasi fermo + nessun nuovo spawn
      let effectiveFallDuration = cfg.fallDuration;
      let effectiveSpawnInterval = cfg.spawnInterval;
      if (activeEffect?.type === 'freeze') {
        const remaining = activeEffect.expiresAt - ts;
        if (remaining > 0) {
          effectiveFallDuration = cfg.fallDuration * 24;
          effectiveSpawnInterval = Number.POSITIVE_INFINITY;
        } else {
          clearActiveEffect();
        }
      }

      if (animationsPausedRef.current) {
        resumeFallingAnimations(effectiveFallDuration);
        animationsPausedRef.current = false;
      }

      // Update fall speeds when tier advances OR effect changes
      const tierChanged = tierIdx !== prevTierRef.current && prevTierRef.current !== -1;
      const effectChanged =
        Math.abs(effectiveFallDuration - prevEffectiveFallRef.current) > 50;

      if (tierChanged || effectChanged) {
        updateFallSpeeds(effectiveFallDuration);
      }
      prevTierRef.current = tierIdx;
      prevEffectiveFallRef.current = effectiveFallDuration;

      // ── Bomb tiles: explode when they cross mid-screen ────────────────────
      const midY = screenHeight * 0.52; // slightly past centre
      for (const tile of [...tilesRef.current]) {
        if (tile.kind !== 'bomb' || tile.status !== 'falling') continue;
        const yAnim = yAnimsRef.current.get(tile.id);
        if (!yAnim || yAnim.value < midY) continue;

        // Cancel animation so the withTiming exit callback doesn't fire
        cancelAnimation(yAnim);
        // Mark 'hit' so the Tile component plays its pop-out animation,
        // which calls onRemove → removeTile for final cleanup
        tilesRef.current = tilesRef.current.map((t) =>
          t.id === tile.id ? { ...t, status: 'hit' } : t,
        );
        publishTiles();
        loseLife(tile.colorId);
        onBombExplode?.();
      }

      // ── Spawn a new tile ──────────────────────────────────────────────────
      if (ts - lastSpawnRef.current >= effectiveSpawnInterval) {
        const fresh = spawnTile(
          useGameStore.getState().nextByColor,
          cfg,
          screenWidth,
          TILE_RADIUS,
        );
        startFallAnim(fresh, effectiveFallDuration);
        tilesRef.current = [...tilesRef.current, fresh];
        publishTiles();
        lastSpawnRef.current = ts;
      }
    }, LOGIC_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, gameSessionId, screenWidth, screenHeight]);

  // ── External control ──────────────────────────────────────────────────────

  const removeTile = useCallback(
    (id: string) => {
      const a = yAnimsRef.current.get(id);
      if (a) {
        cancelAnimation(a);
        yAnimsRef.current.delete(id);
      }
      tilesRef.current = tilesRef.current.filter((t) => t.id !== id);
      publishTiles();
    },
    [publishTiles],
  );

  const markTile = useCallback(
    (id: string, tileStatus: TileData['status']) => {
      if (tileStatus === 'hit') {
        const a = yAnimsRef.current.get(id);
        if (a) cancelAnimation(a);
      }
      tilesRef.current = tilesRef.current.map((t) =>
        t.id === id ? { ...t, status: tileStatus } : t,
      );
      publishTiles();
    },
    [publishTiles],
  );

  const clearBoardForPause = useCallback(() => {
    for (const a of yAnimsRef.current.values()) cancelAnimation(a);
    yAnimsRef.current.clear();
    tilesRef.current = [];
    publishTiles();
  }, [publishTiles]);

  return { tileYAnims: yAnimsRef, removeTile, markTile, clearBoardForPause };
}
