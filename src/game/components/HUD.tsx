import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../store/gameStore';
import { COLORS, COLOR_ORDER } from '../config/colors';
import type { ColorId } from '../config/colors';

// ─── Score flash ────────────────────────────────────────────────────────────

function ScoreDisplay() {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const prevScore = useRef(score);
  const scaleAnim = useSharedValue(1);

  useEffect(() => {
    if (score > prevScore.current) {
      scaleAnim.value = withSequence(
        withTiming(1.25, { duration: 80 }),
        withTiming(1, { duration: 120 }),
      );
    }
    prevScore.current = score;
  }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleAnim.value }] }));

  return (
    <View style={styles.scoreBlock}>
      <Animated.Text style={[styles.scoreText, animStyle]}>{score}</Animated.Text>
      {combo > 1 && <Text style={styles.comboText}>×{combo}</Text>}
    </View>
  );
}

// ─── Lives (hearts) ─────────────────────────────────────────────────────────

function Lives() {
  const lives = useGameStore((s) => s.lives);
  return (
    <View style={styles.livesRow}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={[styles.heart, { opacity: i <= lives ? 1 : 0.2 }]}>
          ♥
        </Text>
      ))}
    </View>
  );
}

// ─── Colour chain counters ───────────────────────────────────────────────────

function ChainBadge({ colorId }: { colorId: ColorId }) {
  const next = useGameStore((s) => s.nextByColor[colorId]);
  const tier = useGameStore((s) => s.tier);
  const visible = tier < 2 ? colorId !== 'butter' : true;

  const scaleAnim = useSharedValue(1);
  const prevNext = useRef(next);

  useEffect(() => {
    if (next !== prevNext.current) {
      scaleAnim.value = withSequence(
        withTiming(1.4, { duration: 70 }),
        withTiming(1, { duration: 100 }),
      );
    }
    prevNext.current = next;
  }, [next]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scaleAnim.value }] }));

  if (!visible) return null;

  const { tile: bg, text } = COLORS[colorId];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Animated.Text style={[styles.badgeNum, { color: text }, animStyle]}>{next}</Animated.Text>
    </View>
  );
}

// ─── Tier dots ──────────────────────────────────────────────────────────────

function TierDots() {
  const tier = useGameStore((s) => s.tier);
  return (
    <View style={styles.tierDotsRow}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.tierDot,
            { backgroundColor: i <= tier ? '#3D3D3D' : '#DDD' },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Main HUD ────────────────────────────────────────────────────────────────

function HUDComponent() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]} pointerEvents="none">
      <Lives />
      <View style={styles.centerCol}>
        <ScoreDisplay />
        <TierDots />
      </View>
      <View style={styles.chainsRow}>
        {COLOR_ORDER.map((c) => (
          <ChainBadge key={c} colorId={c} />
        ))}
      </View>
    </View>
  );
}

export const HUD = memo(HUDComponent);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(250,247,242,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  livesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heart: {
    fontSize: 22,
    color: '#F4A6A0',
  },
  centerCol: {
    alignItems: 'center',
    gap: 4,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  tierDotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#3D3D3D',
    letterSpacing: -1,
  },
  comboText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8D8C9',
    marginTop: -2,
  },
  chainsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeNum: {
    fontSize: 18,
    fontWeight: '800',
  },
});
