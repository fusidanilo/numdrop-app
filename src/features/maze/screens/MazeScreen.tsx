import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMazeStore } from '@/features/maze/store/mazeStore';
import { useMazeTimer } from '@/features/maze/hooks/useMazeTimer';
import { useMazeAndroidBack } from '@/features/maze/hooks/useMazeAndroidBack';
import { MazeGrid } from '@/features/maze/components/MazeGrid';
import { MazeHUD } from '@/features/maze/components/MazeHUD';
import { MazeTargetDisplay } from '@/features/maze/components/MazeTargetDisplay';
import { ModeReadyLayout } from '@/features/game-play/components/ModeReadyLayout';
import { styles as pauseMenuStyles } from '@/features/game-play/styles/gameScreen.styles';
import type { HowToPlayTip } from '@/game/config/howToPlayTips';
import { computeTimeCapMs } from '@/features/maze/config/pathDifficulty';
import {
  MAZE_HORIZONTAL_PADDING,
  mazeScreenStyles as styles,
} from '@/features/maze/styles/maze.styles';

export default function MazeScreen() {
  const { t, i18n } = useTranslation(['maze', 'game']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const pathTips = useMemo(
    () => t('tipsPath', { returnObjects: true }) as HowToPlayTip[],
    [t, i18n.language],
  );

  const status = useMazeStore((s) => s.status);
  const score = useMazeStore((s) => s.score);
  const round = useMazeStore((s) => s.round);
  const timeLeft = useMazeStore((s) => s.timeLeft);
  const streak = useMazeStore((s) => s.streak);
  const targetSequence = useMazeStore((s) => s.targetSequence);
  const currentPath = useMazeStore((s) => s.currentPath);
  const isPaused = useMazeStore((s) => s.isPaused);
  const startGame = useMazeStore((s) => s.startGame);
  const setPaused = useMazeStore((s) => s.setPaused);
  const resetToIdle = useMazeStore((s) => s.resetToIdle);
  const devJumpToRound = useMazeStore((s) => s.devJumpToRound);

  useMazeTimer();

  const openPauseMenu = useCallback(() => {
    setPaused(true);
  }, [setPaused]);

  const resumeFromMenu = useCallback(() => {
    setPaused(false);
  }, [setPaused]);

  const restartFromMenu = useCallback(() => {
    startGame();
  }, [startGame]);

  const quitToHomeFromMenu = useCallback(() => {
    setPaused(false);
    resetToIdle();
    router.replace('/');
  }, [setPaused, resetToIdle, router]);

  useMazeAndroidBack(openPauseMenu);

  /** iOS swipe-back / stack pop: pausa invece di uscire mentre si gioca (native-stack + usePreventRemove). */
  const preventLeaveWhilePlaying = status === 'playing' && !isPaused;
  usePreventRemove(
    preventLeaveWhilePlaying,
    useCallback(() => {
      useMazeStore.getState().setPaused(true);
    }, []),
  );

  const gridSize = width - MAZE_HORIZONTAL_PADDING * 2;

  const handleStart = () => {
    startGame();
  };

  const handleBack = () => {
    resetToIdle();
    router.replace('/');
  };

  if (status === 'idle') {
    return (
      <ModeReadyLayout
        onBack={handleBack}
        onStart={handleStart}
        paddingBottom={insets.bottom + 12}
        paddingTop={insets.top + 10}
        tips={pathTips}
      />
    );
  }

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.gameplay}>
        <MazeHUD
          score={score}
          round={round}
          timeLeft={timeLeft}
          totalTime={computeTimeCapMs(round)}
          streak={streak}
        />

        <View style={styles.targetSection}>
          <MazeTargetDisplay
            sequence={targetSequence}
            currentPathLength={currentPath.length}
          />
        </View>

        <View style={styles.gridWrapper}>
          <MazeGrid gridSize={gridSize} />
        </View>
      </View>

      {isPaused && (
        <View
          style={[
            pauseMenuStyles.menuOverlay,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              paddingLeft: insets.left + 20,
              paddingRight: insets.right + 20,
            },
          ]}
        >
          <View style={pauseMenuStyles.menuInner}>
            <View style={[pauseMenuStyles.menuCard, { maxHeight: height * 0.84 }]}>
              <Text style={pauseMenuStyles.menuTitle}>{t('pause.title')}</Text>
              <Text style={pauseMenuStyles.menuSubtitle}>{t('pause.subtitle')}</Text>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtn,
                  pauseMenuStyles.menuBtnPrimary,
                  pressed && pauseMenuStyles.menuBtnPrimaryPressed,
                ]}
                onPress={resumeFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnPrimaryText}>{t('pause.resume')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtn,
                  pauseMenuStyles.menuBtnSecondary,
                  pressed && pauseMenuStyles.menuBtnSecondaryPressed,
                ]}
                onPress={restartFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnSecondaryText}>{t('pause.newGame')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtnGhost,
                  pressed && pauseMenuStyles.menuBtnGhostPressed,
                ]}
                onPress={quitToHomeFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnGhostText}>{t('pause.exitHome')}</Text>
              </Pressable>

              {__DEV__ && (
                <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' }}>
                  <Text style={[pauseMenuStyles.menuSubtitle, { marginBottom: 10 }]}>
                    Path (__DEV__): R10 ≈ difficoltà massima griglia; R57 ≈ tetto timer minimo (10s).
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(
                      [
                        [1, 'R1'],
                        [3, 'R3'],
                        [6, 'R6'],
                        [10, 'R10 max'],
                        [25, 'R25'],
                        [57, 'R57 min'],
                      ] as const
                    ).map(([r, label]) => (
                      <Pressable
                        key={r}
                        style={({ pressed }) => ({
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: pressed ? '#E0DDD8' : '#EEEAE4',
                        })}
                        onPress={() => {
                          devJumpToRound(r);
                          resumeFromMenu();
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#333' }}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
