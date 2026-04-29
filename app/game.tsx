import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, useWindowDimensions, BackHandler, Platform } from 'react-native';
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
  const isPaused = useGameStore((s) => s.isPaused);
  const gameSessionId = useGameStore((s) => s.gameSessionId);
  const startGame = useGameStore((s) => s.startGame);
  const setHighScore = useGameStore((s) => s.setHighScore);
  const resetSessionIdle = useGameStore((s) => s.resetSessionIdle);

  // Leaving mid-game (gesture back, stack pop, etc.) must not leave `playing` in the store.
  useFocusEffect(
    useCallback(() => {
      const currentStatus = useGameStore.getState().status;
      if (currentStatus === 'over') {
        useGameStore.setState({ status: 'idle' });
      }
      return () => {
        if (useGameStore.getState().status === 'playing') {
          resetSessionIdle();
        }
      };
    }, [resetSessionIdle]),
  );

  useEffect(() => {
    prevTierRef.current = -1;
  }, [gameSessionId]);

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

  const openPauseMenu = useCallback(() => {
    useGameStore.getState().setPaused(true);
  }, []);

  const resumeFromMenu = useCallback(() => {
    useGameStore.getState().setPaused(false);
  }, []);

  const restartFromMenu = useCallback(() => {
    startGame();
  }, [startGame]);

  const quitToHomeFromMenu = useCallback(() => {
    useGameStore.getState().setPaused(false);
    resetSessionIdle();
    router.back();
  }, [resetSessionIdle, router]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (useGameStore.getState().status !== 'playing') return false;
      if (!useGameStore.getState().isPaused) {
        openPauseMenu();
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [openPauseMenu]);

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
      if (useGameStore.getState().isPaused) return;
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
    <View style={styles.root}>
      {isPaused && (
        <View
          style={[
            styles.menuOverlay,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              paddingLeft: insets.left + 20,
              paddingRight: insets.right + 20,
            },
          ]}
        >
          <View style={styles.menuInner}>
            <View style={[styles.menuCard, { maxHeight: height * 0.84 }]}>
              <Text style={styles.menuTitle}>Game Paused</Text>
              <Text style={styles.menuSubtitle}>Take a breath - jump back in when ready.</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.menuBtn,
                  styles.menuBtnPrimary,
                  pressed && styles.menuBtnPrimaryPressed,
                ]}
                onPress={resumeFromMenu}
              >
                <Text style={styles.menuBtnPrimaryText}>Resume</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.menuBtn,
                  styles.menuBtnSecondary,
                  pressed && styles.menuBtnSecondaryPressed,
                ]}
                onPress={restartFromMenu}
              >
                <Text style={styles.menuBtnSecondaryText}>New Game</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.menuBtnGhost, pressed && styles.menuBtnGhostPressed]}
                onPress={quitToHomeFromMenu}
              >
                <Text style={styles.menuBtnGhostText}>Exit to Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

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
