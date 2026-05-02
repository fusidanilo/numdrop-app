import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMazeStore } from '@/features/maze/store/mazeStore';
import { useMazeTimer } from '@/features/maze/hooks/useMazeTimer';
import { MazeGrid } from '@/features/maze/components/MazeGrid';
import { MazeHUD } from '@/features/maze/components/MazeHUD';
import { MazeTargetDisplay } from '@/features/maze/components/MazeTargetDisplay';
import { ModeReadyLayout } from '@/features/game-play/components/ModeReadyLayout';
import type { HowToPlayTip } from '@/game/config/howToPlayTips';
import {
  MAZE_HORIZONTAL_PADDING,
  MAZE_TOTAL_TIME_MS,
  mazeScreenStyles as styles,
} from '@/features/maze/styles/maze.styles';

export default function MazeScreen() {
  const { t, i18n } = useTranslation('maze');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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
  const startGame = useMazeStore((s) => s.startGame);

  useMazeTimer();

  const gridSize = width - MAZE_HORIZONTAL_PADDING * 2;

  const handleStart = () => {
    startGame();
  };

  const handleBack = () => {
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
          totalTime={MAZE_TOTAL_TIME_MS}
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
    </View>
  );
}
