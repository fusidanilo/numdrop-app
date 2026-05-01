import React, { useEffect, useRef, memo } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/game/store/gameStore';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import type { ColorId } from '@/game/config/colors';
import { styles, tierDotColors } from '@/features/game-play/styles/hud.styles';

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
      <View style={styles.comboRow}>
        {combo > 1 ? <Text style={styles.comboText}>×{combo}</Text> : null}
      </View>
    </View>
  );
}

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

  if (!visible) {
    return <View style={styles.badgePlaceholder} />;
  }

  const { tile: bg, text } = COLORS[colorId];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Animated.Text style={[styles.badgeNum, { color: text }, animStyle]}>{next}</Animated.Text>
    </View>
  );
}

const TIERS_PER_DOT_CYCLE = 7;

function TierDots() {
  const tier = useGameStore((s) => s.tier);
  const cyclePos = tier % TIERS_PER_DOT_CYCLE;
  const phase = Math.floor(tier / TIERS_PER_DOT_CYCLE);

  return (
    <View style={styles.tierDotsRow}>
      {Array.from({ length: TIERS_PER_DOT_CYCLE }, (_, i) => (
        <View
          key={i}
          style={[
            styles.tierDot,
            { backgroundColor: i <= cyclePos ? tierDotColors.active : tierDotColors.inactive },
          ]}
        />
      ))}
      {phase > 0 && <Text style={styles.phaseLabel}>×{phase + 1}</Text>}
    </View>
  );
}

function HUDComponent() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]} pointerEvents="none">
      <View style={[styles.hudThird, styles.hudThirdLeft]}>
        <Lives />
      </View>
      <View style={[styles.hudThird, styles.hudThirdCenter]}>
        <View style={styles.centerCol}>
          <ScoreDisplay />
          <TierDots />
        </View>
      </View>
      <View style={[styles.hudThird, styles.hudThirdRight]}>
        <View style={styles.chainsRow}>
          {COLOR_ORDER.map((c) => (
            <ChainBadge key={c} colorId={c} />
          ))}
        </View>
      </View>
    </View>
  );
}

export const HUD = memo(HUDComponent);
