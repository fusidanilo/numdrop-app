import React, { useEffect, memo } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { TileData } from '@/game/engine/spawner';
import { TILE_RADIUS } from '@/game/engine/loop';
import { styles } from '@/features/game-play/styles/tile.styles';
import { COLORS } from '@/game/config/colors';

interface TileProps {
  data: TileData;
  /** Reanimated shared value for the tile's Y centre (UI thread, smooth 60fps) */
  yAnim: SharedValue<number>;
  onTap: (tile: TileData) => void;
  onRemove: (id: string) => void;
}

/** Visual config per tile kind */
const KIND_STYLES: Record<
  TileData['kind'],
  { bgOverride?: string; textOverride?: string; borderColor?: string; borderWidth?: number }
> = {
  normal: {},
  ghost: { borderColor: 'rgba(255,255,255,0.6)', borderWidth: 2 },
  double: { borderColor: '#A8D8C9', borderWidth: 3 },
  bomb: {
    bgOverride: '#2A2A2A',
    textOverride: '#FFFFFF',
    borderColor: '#FF5252',
    borderWidth: 2.5,
  },
  bonus: {
    bgOverride: '#F2C94C',
    textOverride: '#5C3D00',
    borderColor: '#FFE082',
    borderWidth: 2.5,
  },
};

/** How long (ms) a ghost tile's number stays visible before fading */
const GHOST_VISIBLE_MS = 650;
const GHOST_FADE_MS = 250;

function TileComponent({ data, yAnim, onTap, onRemove }: TileProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shakeX = useSharedValue(0);
  /** Opacity of the label only (ghost fade, bonus star) */
  const labelOpacity = useSharedValue(1);

  const { tile: bgColor, text: textColor } = COLORS[data.colorId];
  const kindStyle = KIND_STYLES[data.kind];
  const tileBackground = kindStyle.bgOverride ?? bgColor;
  const labelColor = kindStyle.textOverride ?? textColor;

  useEffect(() => {
    if (data.kind === 'ghost') {
      labelOpacity.value = withDelay(GHOST_VISIBLE_MS, withTiming(0, { duration: GHOST_FADE_MS }));
    } else {
      labelOpacity.value = 1;
    }
  }, [data.id, data.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data.status === 'hit') {
      scale.value = withSequence(
        withTiming(1.35, { duration: 80 }),
        withTiming(0, { duration: 130 }, (finished) => {
          'worklet';
          if (finished) runOnJS(onRemove)(data.id);
        }),
      );
      opacity.value = withTiming(0, { duration: 210 });
    } else if (data.status === 'miss') {
      scale.value = 1;
      opacity.value = 1;
      shakeX.value = withSequence(
        withTiming(-9, { duration: 45 }),
        withTiming(9, { duration: 45 }),
        withTiming(-9, { duration: 45 }),
        withTiming(9, { duration: 45 }),
        withTiming(0, { duration: 40 }),
      );
    } else {
      scale.value = withTiming(1, { duration: 80 });
      opacity.value = withTiming(1, { duration: 80 });
    }
  }, [data.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    top: yAnim.value - TILE_RADIUS,
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
    opacity: opacity.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  const handlePress = () => {
    if (data.status !== 'falling') return;
    onTap(data);
  };

  const label = data.kind === 'bonus' ? '★' : data.num > 0 ? String(data.num) : '★';

  return (
    <Animated.View
      style={[
        styles.tile,
        {
          left: data.x - TILE_RADIUS,
          backgroundColor: tileBackground,
          borderColor: kindStyle.borderColor,
          borderWidth: kindStyle.borderWidth ?? 0,
        },
        animStyle,
      ]}
    >
      <Pressable style={styles.pressable} onPress={handlePress} hitSlop={8}>
        <Animated.Text style={[styles.num, { color: labelColor }, labelStyle]}>
          {label}
        </Animated.Text>
        {data.kind === 'double' && (
          <Text style={[styles.kindBadge, { color: labelColor }]}>×2</Text>
        )}
        {data.kind === 'bomb' && (
          <Text style={styles.kindBadge}>💣</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Only re-render when the tile's identity or interactive status changes.
 * Y position changes do NOT go through React state — they live in yAnim.
 */
export const Tile = memo(TileComponent, (prev, next) => {
  return prev.data.id === next.data.id && prev.data.status === next.data.status;
});
