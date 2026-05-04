import React, { useMemo, useCallback } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTraceStore } from '@/features/trace/store/traceStore';
import { useTraceTimer } from '@/features/trace/hooks/useTraceTimer';
import { useTraceAndroidBack } from '@/features/trace/hooks/useTraceAndroidBack';
import { TraceGrid } from '@/features/trace/components/TraceGrid';
import { TraceHUD } from '@/features/trace/components/TraceHUD';
import { TraceProgressHint } from '@/features/trace/components/TraceProgressHint';
import { ModeReadyLayout } from '@/features/game-play/components/ModeReadyLayout';
import { styles as pauseMenuStyles } from '@/features/game-play/styles/gameScreen.styles';
import type { HowToPlayTip } from '@/game/config/howToPlayTips';
import { computeTimeCapMs } from '@/features/trace/config/traceDifficulty';
import {
  MAZE_HORIZONTAL_PADDING,
  mazeScreenStyles as styles,
} from '@/features/maze/styles/maze.styles';

export default function TraceScreen() {
  const { t, i18n } = useTranslation(['trace', 'game']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const traceTips = useMemo(
    () => t('tipsTrace', { returnObjects: true }) as HowToPlayTip[],
    [t, i18n.language],
  );

  const status = useTraceStore((s) => s.status);
  const score = useTraceStore((s) => s.score);
  const round = useTraceStore((s) => s.round);
  const timeLeft = useTraceStore((s) => s.timeLeft);
  const streak = useTraceStore((s) => s.streak);
  const currentPath = useTraceStore((s) => s.currentPath);
  const expectedCellCount = useTraceStore((s) => s.expectedCellCount);
  const isPaused = useTraceStore((s) => s.isPaused);
  const startGame = useTraceStore((s) => s.startGame);
  const setPaused = useTraceStore((s) => s.setPaused);
  const resetToIdle = useTraceStore((s) => s.resetToIdle);
  const devJumpToRound = useTraceStore((s) => s.devJumpToRound);

  useTraceTimer();

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

  useTraceAndroidBack(openPauseMenu);

  const preventLeaveWhilePlaying = status === 'playing' && !isPaused;
  usePreventRemove(
    preventLeaveWhilePlaying,
    useCallback(() => {
      useTraceStore.getState().setPaused(true);
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
        tips={traceTips}
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
        <TraceHUD
          score={score}
          round={round}
          timeLeft={timeLeft}
          totalTime={computeTimeCapMs(round)}
          streak={streak}
        />

        <View style={styles.targetSection}>
          <TraceProgressHint covered={currentPath.length} total={expectedCellCount} />
        </View>

        <View style={styles.gridWrapper}>
          <TraceGrid gridSize={gridSize} />
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
              <Text style={pauseMenuStyles.menuTitle}>{t('pause.title', { ns: 'game' })}</Text>
              <Text style={pauseMenuStyles.menuSubtitle}>{t('pause.subtitle', { ns: 'game' })}</Text>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtn,
                  pauseMenuStyles.menuBtnPrimary,
                  pressed && pauseMenuStyles.menuBtnPrimaryPressed,
                ]}
                onPress={resumeFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnPrimaryText}>
                  {t('pause.resume', { ns: 'game' })}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtn,
                  pauseMenuStyles.menuBtnSecondary,
                  pressed && pauseMenuStyles.menuBtnSecondaryPressed,
                ]}
                onPress={restartFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnSecondaryText}>
                  {t('pause.newGame', { ns: 'game' })}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  pauseMenuStyles.menuBtnGhost,
                  pressed && pauseMenuStyles.menuBtnGhostPressed,
                ]}
                onPress={quitToHomeFromMenu}
              >
                <Text style={pauseMenuStyles.menuBtnGhostText}>
                  {t('pause.exitHome', { ns: 'game' })}
                </Text>
              </Pressable>

              {__DEV__ && (
                <View
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text style={[pauseMenuStyles.menuSubtitle, { marginBottom: 10 }]}>
                    Trace (__DEV__): R1–6 = 4×4; R7–14 = 5×5; R15+ = 6×6. R57 ≈ min timer cap (10s).
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {(
                      [
                        [1, 'R1'],
                        [3, 'R3'],
                        [6, 'R6'],
                        [10, 'R10'],
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
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#333' }}>
                          {label}
                        </Text>
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
