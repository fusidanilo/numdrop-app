import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useGameStore } from '@/game/store/gameStore';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import { styles } from '@/styles/gameOverScreen.styles';

export default function GameOverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const startGame = useGameStore((s) => s.startGame);
  const isNewBest = score > 0 && score >= highScore;

  // Entry animations
  const titleScale = useSharedValue(0.6);
  const titleOpacity = useSharedValue(0);
  const scoreOpacity = useSharedValue(0);
  const btnsOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 14, stiffness: 160 });
    titleOpacity.value = withTiming(1, { duration: 300 });
    scoreOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    btnsOpacity.value = withDelay(400, withTiming(1, { duration: 350 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));
  const scoreStyle = useAnimatedStyle(() => ({ opacity: scoreOpacity.value }));
  const btnsStyle = useAnimatedStyle(() => ({ opacity: btnsOpacity.value }));

  const handlePlayAgain = () => {
    startGame();
    router.replace('/game');
  };

  const handleHome = () => {
    useGameStore.setState({ status: 'idle' });
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 },
      ]}
    >
      {/* Colour dots decoration */}
      <View style={styles.dotsRow}>
        {COLOR_ORDER.map((c) => (
          <View key={c} style={[styles.dot, { backgroundColor: COLORS[c].tile }]} />
        ))}
      </View>

      <Animated.Text style={[styles.gameOverTitle, titleStyle]}>
        Game Over
      </Animated.Text>

      <Animated.View style={[styles.scoreCard, scoreStyle]}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreValue}>{score}</Text>
        {isNewBest && <Text style={styles.newBest}>New best!</Text>}
        <View style={styles.divider} />
        <Text style={styles.bestLabel}>Best</Text>
        <Text style={styles.bestValue}>{highScore}</Text>
      </Animated.View>

      <View style={styles.spacer} />

      <Animated.View style={[styles.buttons, btnsStyle]}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.btnPrimaryText}>Play Again</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnSecondaryPressed]}
          onPress={handleHome}
        >
          <Text style={styles.btnSecondaryText}>Home</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
