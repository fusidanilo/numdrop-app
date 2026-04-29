import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useGameStore } from '../src/game/store/gameStore';
import { useGameLoop } from '../src/game/engine/loop';
import { Tile } from '../src/game/components/Tile';
import { HUD } from '../src/game/components/HUD';
import type { TileData } from '../src/game/engine/spawner';
import { feedbackHit, feedbackMiss, feedbackGameOver, feedbackComboMilestone } from '../src/game/utils/sound';
import { saveHighScore, loadHighScore } from '../src/game/utils/storage';

const TIER_LABELS = ['', 'Level 2', 'Level 3 — 3rd colour!', 'Max speed!'];

export default function GameScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tiles, setTiles] = useState<TileData[]>([]);
  const prevStatusRef = useRef<string>('idle');
  const prevTierRef = useRef<number>(0);
  const [tierLabel, setTierLabel] = useState('');

  // Tier-up flash animation
  const tierFlashOpacity = useSharedValue(0);
  const tierFlashScale = useSharedValue(0.7);
  const tierFlashStyle = useAnimatedStyle(() => ({
    opacity: tierFlashOpacity.value,
    transform: [{ scale: tierFlashScale.value }],
  }));

  const status = useGameStore((s) => s.status);
  const tier = useGameStore((s) => s.tier);
  const startGame = useGameStore((s) => s.startGame);
  const setHighScore = useGameStore((s) => s.setHighScore);

  // Reset to idle when the screen is focused from Home (not from gameover "play again")
  useFocusEffect(
    useCallback(() => {
      const currentStatus = useGameStore.getState().status;
      // Only reset if we're arriving from a completed/idle state, not mid-play
      if (currentStatus === 'over') {
        useGameStore.setState({ status: 'idle' });
      }
    }, []),
  );

  // ── Game loop ──────────────────────────────────────────────────────────────
  const { tileYAnims, removeTile, markTile } = useGameLoop({
    screenWidth: width,
    screenHeight: height,
    onTilesChange: setTiles,
  });

  // ── Tier-up flash ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (tier > 0 && tier > prevTierRef.current) {
      setTierLabel(TIER_LABELS[tier] ?? `Level ${tier + 1}`);
      tierFlashOpacity.value = withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(1, { duration: 900 }),
        withTiming(0, { duration: 350 }),
      );
      tierFlashScale.value = withSequence(
        withTiming(1, { duration: 180 }),
        withTiming(1.04, { duration: 900 }),
        withTiming(0.8, { duration: 350 }),
      );
    }
    prevTierRef.current = tier;
  }, [tier]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate to gameover when game ends ────────────────────────────────────
  useEffect(() => {
    if (status === 'over' && prevStatusRef.current === 'playing') {
      feedbackGameOver();
      const finalScore = useGameStore.getState().score;
      loadHighScore().then((stored) => {
        const best = Math.max(stored, finalScore);
        saveHighScore(best);
        setHighScore(best);
        // Route is valid at runtime; types update after expo bundler runs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/gameover' as any);
      });
    }
    prevStatusRef.current = status;
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tile tap handler ───────────────────────────────────────────────────────
  const handleTileTap = useCallback(
    (tile: TileData) => {
      const { nextByColor, tapHit, tapMiss, combo } = useGameStore.getState();

      if (tile.num === nextByColor[tile.colorId]) {
        tapHit(tile.colorId);
        markTile(tile.id, 'hit');
        // Combo milestone haptic at every 5th hit
        if (combo > 0 && combo % 5 === 0) {
          feedbackComboMilestone();
        } else {
          feedbackHit();
        }
      } else {
        tapMiss(tile.colorId);
        markTile(tile.id, 'miss');
        feedbackMiss();
        // Reset tile status back to 'falling' after shake animation (≈280ms)
        setTimeout(() => {
          markTile(tile.id, 'falling');
        }, 310);
      }
    },
    [markTile],
  );

  const handleTileRemove = useCallback(
    (id: string) => removeTile(id),
    [removeTile],
  );

  // ── Start overlay ──────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <View style={[styles.overlay, { backgroundColor: '#FAF7F2' }]}>
        <Text style={styles.overlayTitle}>Ready?</Text>
        <Text style={styles.overlayHint}>
          Tap each colour's{'\n'}next number before{'\n'}it falls off screen.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.7 }]}
          onPress={startGame}
        >
          <Text style={styles.startBtnText}>Start</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width, height }]}>
      {/* Falling tiles — yAnim lives on the UI thread, no JS re-renders for motion */}
      {tiles.map((tile) => {
        const yAnim = tileYAnims.current.get(tile.id);
        if (!yAnim) return null;
        return (
          <Tile
            key={tile.id}
            data={tile}
            yAnim={yAnim}
            onTap={handleTileTap}
            onRemove={handleTileRemove}
          />
        );
      })}

      {/* HUD overlaid on top */}
      <HUD />

      {/* Tier-up flash */}
      <Animated.View style={[styles.tierFlash, tierFlashStyle]} pointerEvents="none">
        <Text style={styles.tierFlashText}>{tierLabel}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FAF7F2',
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  overlayTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2E2E2E',
    letterSpacing: -1.5,
  },
  overlayHint: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  startBtn: {
    width: '100%',
    backgroundColor: '#3D3D3D',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAF7F2',
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    fontSize: 15,
    color: '#AAA',
    fontWeight: '500',
  },
  tierFlash: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  tierFlashText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3D3D3D',
    backgroundColor: 'rgba(250,247,242,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    letterSpacing: -0.3,
  },
});
