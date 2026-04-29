import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useGameStore } from '../src/game/store/gameStore';
import { COLORS, COLOR_ORDER } from '../src/game/config/colors';

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
          style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.75 }]}
          onPress={handlePlayAgain}
        >
          <Text style={styles.btnPrimaryText}>Play Again</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && { opacity: 0.6 }]}
          onPress={handleHome}
        >
          <Text style={styles.btnSecondaryText}>Home</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  gameOverTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#2E2E2E',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  scoreCard: {
    marginTop: 32,
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '800',
    color: '#2E2E2E',
    letterSpacing: -3,
    marginTop: 2,
  },
  newBest: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A8D8C9',
    marginTop: -4,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 14,
  },
  bestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCC',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bestValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: -1,
    marginTop: 2,
  },
  spacer: { flex: 1 },
  buttons: {
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#3D3D3D',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FAF7F2',
  },
  btnSecondary: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#BBB',
  },
});
