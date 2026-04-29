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
import type { TileData } from './spawner';
import { spawnTile, resetSpawnerCounter } from './spawner';
import { getTierConfig, getTierIndex } from '../config/levels';
import type { ColorId } from '../config/colors';
import { useGameStore } from '../store/gameStore';

export const TILE_RADIUS = 28;
/** How often the JS loop fires (only for spawn/tier, not position updates) */
const LOGIC_MS = 50;

export interface UseGameLoopReturn {
  /** Ref to the Map of Reanimated Y shared values, keyed by tile id */
  tileYAnims: MutableRefObject<Map<string, SharedValue<number>>>;
  removeTile: (id: string) => void;
  markTile: (id: string, status: TileData['status']) => void;
}

export function useGameLoop({
  screenWidth,
  screenHeight,
  onTilesChange,
}: {
  screenWidth: number;
  screenHeight: number;
  onTilesChange: (tiles: TileData[]) => void;
}): UseGameLoopReturn {
  const tilesRef = useRef<TileData[]>([]);
  const yAnimsRef = useRef<Map<string, SharedValue<number>>>(new Map());
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const prevTierRef = useRef(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const EXIT_Y = screenHeight + TILE_RADIUS;

  const status = useGameStore((s) => s.status);

  // ── Publish tile metadata to React state (no y needed) ──────────────────
  const publishTiles = useCallback(() => {
    onTilesChange([...tilesRef.current]);
  }, [onTilesChange]);

  // ── Called (via runOnJS) when a tile's fall animation completes ───────────
  const handleTileExit = useCallback(
    (id: string, colorId: string, num: number) => {
      const { nextByColor, loseLife } = useGameStore.getState();
      if (num === nextByColor[colorId as ColorId]) {
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

      // This runs entirely on the UI thread. The callback fires once when done.
      yAnim.value = withTiming(EXIT_Y, { duration, easing: Easing.linear }, (finished) => {
        'worklet';
        if (finished) runOnJS(onExit)(tileId, colorId, num);
      });
    },
    [EXIT_Y, handleTileExit],
  );

  // ── Restart animations with updated speed on tier change ─────────────────
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

  // ── Main effect: start/stop the logic interval ────────────────────────────
  useEffect(() => {
    if (status !== 'playing') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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

    const now = Date.now();
    startTimeRef.current = now;
    lastSpawnRef.current = now - 9999; // trigger immediate first spawn

    intervalRef.current = setInterval(() => {
      const ts = Date.now();
      const elapsed = ts - startTimeRef.current;
      const { setTier, status: currentStatus } = useGameStore.getState();

      if (currentStatus !== 'playing') return;

      const tierIdx = getTierIndex(elapsed);
      setTier(tierIdx);
      const cfg = getTierConfig(elapsed);

      // Speed update when tier advances
      if (tierIdx !== prevTierRef.current && prevTierRef.current !== -1) {
        updateFallSpeeds(cfg.fallDuration);
      }
      prevTierRef.current = tierIdx;

      // Spawn a new tile
      if (ts - lastSpawnRef.current >= cfg.spawnInterval) {
        const fresh = spawnTile(
          useGameStore.getState().nextByColor,
          cfg.numColors,
          screenWidth,
          TILE_RADIUS,
        );
        startFallAnim(fresh, cfg.fallDuration);
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
  }, [status, screenWidth, screenHeight]);

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
      // Cancel fall anim for 'hit' so the withTiming callback doesn't fire
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

  return { tileYAnims: yAnimsRef, removeTile, markTile };
}
