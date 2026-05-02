import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useMazeStore } from '@/features/maze/store/mazeStore';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import { mazeOverStyles as styles } from '@/features/maze/styles/maze.styles';

export default function MazeOverScreen() {
  const { t } = useTranslation(['common', 'maze']);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const score = useMazeStore((s) => s.score);
  const highScore = useMazeStore((s) => s.highScore);
  const round = useMazeStore((s) => s.round);
  const startGame = useMazeStore((s) => s.startGame);
  const loadHighScore = useMazeStore((s) => s.loadHighScore);

  const isNewBest = score > 0 && score >= highScore;

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const cardScale = useSharedValue(0.85);
  const cardOpacity = useSharedValue(0);
  const btnsOpacity = useSharedValue(0);
  const btnsY = useSharedValue(16);

  useEffect(() => {
    loadHighScore();

    titleOpacity.value = withTiming(1, { duration: 400 });
    titleY.value = withTiming(0, { duration: 400 });
    cardScale.value = withDelay(150, withSpring(1, { damping: 14, stiffness: 120 }));
    cardOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
    btnsOpacity.value = withDelay(350, withTiming(1, { duration: 350 }));
    btnsY.value = withDelay(350, withTiming(0, { duration: 350 }));
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const btnsStyle = useAnimatedStyle(() => ({
    opacity: btnsOpacity.value,
    transform: [{ translateY: btnsY.value }],
  }));

  const handlePlayAgain = () => {
    startGame();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace('/maze' as any);
  };

  const handleHome = () => {
    useMazeStore.setState({ status: 'idle' });
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <View style={styles.dotsRow}>
        {COLOR_ORDER.map((c) => (
          <View key={c} style={[styles.dot, { backgroundColor: COLORS[c].tile }]} />
        ))}
      </View>

      <Animated.Text style={[styles.title, titleStyle]}>{t('pathOver.modeTitle')}</Animated.Text>
      <Animated.Text style={[styles.subtitle, titleStyle]}>{t('pathOver.subtitle')}</Animated.Text>

      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.cardLabel}>{t('score')}</Text>
        <Text style={styles.cardScore}>{score}</Text>

        {isNewBest && <Text style={styles.newBest}>{t('newBest')}</Text>}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>{t('best')}</Text>
            <Text style={styles.statValue}>{highScore}</Text>
          </View>
          <View style={[styles.statBlock, styles.statRight]}>
            <Text style={styles.statLabel}>{t('round')}</Text>
            <Text style={styles.statValue}>{round}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View style={[styles.buttons, btnsStyle]}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.btnPrimaryText}>{t('playAgainLower')}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={handleHome}
        >
          <Text style={styles.btnSecondaryText}>{t('home')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
