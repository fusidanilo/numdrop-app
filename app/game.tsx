import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useGameStore } from '@/game/store/gameStore';
import { useGameLoop } from '@/game/engine/loop';
import { Tile } from '@/game/components/Tile';
import { HUD } from '@/game/components/HUD';
import type { TileData } from '@/game/engine/spawner';
import {
  feedbackHit,
  feedbackMiss,
  feedbackGameOver,
  feedbackComboMilestone,
  feedbackNewLevel,
  preloadGameSfx,
} from '@/game/utils/sound';
import { saveHighScore, loadHighScore } from '@/game/utils/storage';
import { styles } from '@/styles/gameScreen.styles';

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

  useEffect(() => {
    if (status === 'playing') {
      preloadGameSfx();
    }
  }, [status]);

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
      feedbackNewLevel();
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
      <View style={[styles.overlay, styles.overlayBg]}>
        <Text style={styles.overlayTitle}>Ready?</Text>
        <Text style={styles.overlayHint}>
          Tap each colour's{'\n'}next number before{'\n'}it falls off screen.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          onPress={startGame}
        >
          <Text style={styles.startBtnText}>Start</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          onPress={() => router.back()}
        >
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
