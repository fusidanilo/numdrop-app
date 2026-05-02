import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { mazeHudStyles as styles } from '@/features/maze/styles/maze.styles';

interface Props {
  score: number;
  round: number;
  timeLeft: number;
  totalTime: number;
  streak: number;
}

const LOW_TIME_THRESHOLD = 10_000;

export function MazeHUD({ score, round, timeLeft, totalTime, streak }: Props) {
  const { t } = useTranslation('maze');
  const progress = Math.max(0, timeLeft / totalTime);
  const isLow = timeLeft <= LOW_TIME_THRESHOLD;
  const seconds = Math.ceil(timeLeft / 1000);

  const barWidth = useSharedValue(1);
  const barOpacity = useSharedValue(1);

  useEffect(() => {
    barWidth.value = withTiming(progress, {
      duration: 150,
      easing: Easing.linear,
    });
  }, [progress]);

  useEffect(() => {
    if (isLow) {
      barOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        false,
      );
    } else {
      barOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isLow]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
    opacity: barOpacity.value,
  }));

  const barColor = isLow ? '#E57373' : '#6EC6A8';

  return (
    <View style={styles.hud}>
      {/* Top row: score / round / streak */}
      <View style={styles.topRow}>
        <View style={styles.metricBlock}>
          <Text style={styles.metricLabel}>{t('hudScore')}</Text>
          <Text style={styles.metricValue}>{score}</Text>
        </View>

        <View style={[styles.metricBlock, styles.metricCenter]}>
          <Text style={styles.metricLabel}>{t('hudRound')}</Text>
          <Text style={styles.metricValue}>{round}</Text>
        </View>

        <View style={[styles.metricBlock, styles.metricRight]}>
          <Text style={styles.metricLabel}>{t('hudStreak')}</Text>
          <Text style={styles.metricValue}>
            {streak > 0 ? `×${streak}` : t('streakEmpty')}
          </Text>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerRow}>
        <Text style={[styles.timerSecs, isLow && styles.timerSecsLow]}>{seconds}</Text>
        <View style={styles.barTrack}>
          <Animated.View
            style={[styles.barFill, { backgroundColor: barColor }, barStyle]}
          />
        </View>
      </View>
    </View>
  );
}
