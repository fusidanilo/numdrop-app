import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/game/store/gameStore';
import type { PowerUps } from '@/game/store/gameStore';
import { useGameLoop } from '@/game/engine/loop';
import type { TileData } from '@/game/engine/spawner';
import {
  feedbackHit,
  feedbackMiss,
  feedbackComboMilestone,
  feedbackLoseLife,
} from '@/game/utils/sound';
import {
  getSessionDevSandbox,
  isDevGameMode,
  isSandboxForced,
  setSessionDevSandbox,
  showSandboxControlsOnReady,
} from '@/game/config/devGame';
import { Tile } from '@/features/game-play/components/Tile';
import { HUD } from '@/features/game-play/components/HUD';
import {
  EffectStatusBar,
  EFFECT_STATUS_BAR_TOP_OFFSET,
} from '@/features/game-play/components/EffectStatusBar';
import { ModeReadyLayout } from '@/features/game-play/components/ModeReadyLayout';
import type { HowToPlayTip } from '@/game/config/howToPlayTips';
import { PowerUpBar } from '@/features/game-play/components/PowerUpBar';
import { useAndroidGameBack } from '@/features/game-play/hooks/useAndroidGameBack';
import { useGameFocusSession } from '@/features/game-play/hooks/useGameFocusSession';
import { useNavigateWhenGameOver } from '@/features/game-play/hooks/useNavigateWhenGameOver';
import { useTierUpFlash } from '@/features/game-play/hooks/useTierUpFlash';
import { usePreloadGameSfx } from '@/features/game-play/hooks/usePreloadGameSfx';
import { styles } from '@/features/game-play/styles/gameScreen.styles';
import { devOverlayStyles } from '@/features/game-play/styles/devOverlay.styles';

export default function GameScreen() {
  const { t, i18n } = useTranslation('game');
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const classicTips = useMemo(
    () => t('tipsClassic', { returnObjects: true }) as HowToPlayTip[],
    [t, i18n.language],
  );
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [, setSandboxTick] = useState(0);

  const status = useGameStore((s) => s.status);
  const tier = useGameStore((s) => s.tier);
  const isPaused = useGameStore((s) => s.isPaused);
  const gameSessionId = useGameStore((s) => s.gameSessionId);
  const startGame = useGameStore((s) => s.startGame);
  const resetSessionIdle = useGameStore((s) => s.resetSessionIdle);
  const activatePowerUp = useGameStore((s) => s.activatePowerUp);
  const gainLife = useGameStore((s) => s.gainLife);

  const { tierLabel, tierFlashStyle } = useTierUpFlash(tier, gameSessionId);

  useGameFocusSession(resetSessionIdle);
  usePreloadGameSfx(status);
  useNavigateWhenGameOver(status);

  const handleBombExplode = useCallback(() => {
    feedbackLoseLife();
  }, []);

  const { tileYAnims, removeTile, markTile } = useGameLoop({
    screenWidth: width,
    screenHeight: height,
    onTilesChange: setTiles,
    onBombExplode: handleBombExplode,
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

  useAndroidGameBack(openPauseMenu);

  const preventLeaveWhilePlaying = status === 'playing' && !isPaused;
  usePreventRemove(
    preventLeaveWhilePlaying,
    useCallback(() => {
      useGameStore.getState().setPaused(true);
    }, []),
  );

  const handleTileTap = useCallback(
    (tile: TileData) => {
      if (useGameStore.getState().isPaused) return;
      const { nextByColor, tapHit, tapMiss, gainLife: storeGainLife, combo } =
        useGameStore.getState();

      if (tile.kind === 'bonus') {
        if (!isDevGameMode()) {
          const { lives } = useGameStore.getState();
          if (lives < 3) {
            storeGainLife();
          } else {
            const { score, currentBasePoints } = useGameStore.getState();
            useGameStore.setState({ score: score + currentBasePoints * 50 });
          }
        }
        markTile(tile.id, 'hit');
        feedbackComboMilestone();
        return;
      }

      if (tile.num === nextByColor[tile.colorId]) {
        tapHit(tile.colorId, tile.kind === 'double');
        markTile(tile.id, 'hit');
        if (combo > 0 && combo % 5 === 0) {
          feedbackComboMilestone();
        } else {
          feedbackHit();
        }
      } else {
        tapMiss(tile.colorId);
        markTile(tile.id, 'miss');
        feedbackMiss();
        setTimeout(() => {
          markTile(tile.id, 'falling');
        }, 310);
      }
    },
    [markTile, gainLife],
  );

  const handleTileRemove = useCallback(
    (id: string) => removeTile(id),
    [removeTile],
  );

  const handleActivatePowerUp = useCallback(
    (type: keyof PowerUps) => {
      activatePowerUp(type);
      feedbackComboMilestone();
    },
    [activatePowerUp],
  );

  if (status === 'idle') {
    const sandboxForced = isSandboxForced();
    const sandboxOn = isDevGameMode();
    return (
      <ModeReadyLayout
        footerExtra={
          showSandboxControlsOnReady() ? (
            <Pressable
              style={({ pressed }) => [
                devOverlayStyles.sandboxRow,
                sandboxForced && devOverlayStyles.sandboxLocked,
                pressed && !sandboxForced && devOverlayStyles.sandboxPressed,
              ]}
              onPress={() => {
                if (sandboxForced) return;
                setSessionDevSandbox(!getSessionDevSandbox());
                setSandboxTick((n) => n + 1);
              }}
            >
              <Text style={devOverlayStyles.sandboxLabel}>
                {sandboxForced ? t('sandbox.fullForced') : sandboxOn ? t('sandbox.fullOn') : t('sandbox.fullOff')}
              </Text>
              {!sandboxForced && (
                <Text style={devOverlayStyles.sandboxHint}>{t('sandbox.hint')}</Text>
              )}
            </Pressable>
          ) : null
        }
        onBack={() => router.back()}
        onStart={startGame}
        paddingBottom={insets.bottom + 12}
        paddingTop={insets.top + 10}
        tips={classicTips}
      />
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
              <Text style={styles.menuTitle}>{t('pause.title')}</Text>
              <Text style={styles.menuSubtitle}>{t('pause.subtitle')}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.menuBtn,
                  styles.menuBtnPrimary,
                  pressed && styles.menuBtnPrimaryPressed,
                ]}
                onPress={resumeFromMenu}
              >
                <Text style={styles.menuBtnPrimaryText}>{t('pause.resume')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.menuBtn,
                  styles.menuBtnSecondary,
                  pressed && styles.menuBtnSecondaryPressed,
                ]}
                onPress={restartFromMenu}
              >
                <Text style={styles.menuBtnSecondaryText}>{t('pause.newGame')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.menuBtnGhost, pressed && styles.menuBtnGhostPressed]}
                onPress={quitToHomeFromMenu}
              >
                <Text style={styles.menuBtnGhostText}>{t('pause.exitHome')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {tiles.map((tile) => {
        const yAnim = tileYAnims.current.get(tile.id);
        if (!yAnim) return null;
        return React.createElement(Tile, {
          key: tile.id,
          data: tile,
          yAnim,
          onTap: handleTileTap,
          onRemove: handleTileRemove,
        });
      })}

      <HUD />

      <EffectStatusBar top={insets.top + EFFECT_STATUS_BAR_TOP_OFFSET} />

      {isDevGameMode() && (
        <View style={devOverlayStyles.devRibbonWrap} pointerEvents="none">
          <View style={devOverlayStyles.devRibbon}>
            <Text style={devOverlayStyles.devRibbonText}>{t('dev.sandboxRibbon')}</Text>
          </View>
        </View>
      )}

      <PowerUpBar onActivate={handleActivatePowerUp} />

      <Animated.View style={[styles.tierFlash, tierFlashStyle]} pointerEvents="none">
        <Text style={styles.tierFlashText}>{tierLabel}</Text>
      </Animated.View>
    </View>
  );
}
