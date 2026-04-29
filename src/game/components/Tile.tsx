import React, { useEffect, memo } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { TileData } from '@/game/engine/spawner';
import { TILE_RADIUS } from '@/game/engine/loop';
import { styles } from '@/styles/Tile.styles';
import { COLORS } from '@/game/config/colors';

interface TileProps {
  data: TileData;
  /** Reanimated shared value for the tile's Y centre (UI thread, smooth 60fps) */
  yAnim: SharedValue<number>;
  onTap: (tile: TileData) => void;
  onRemove: (id: string) => void;
}

function TileComponent({ data, yAnim, onTap, onRemove }: TileProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shakeX = useSharedValue(0);

  const { tile: bgColor, text: textColor } = COLORS[data.colorId];

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
      // Reset when status goes back to 'falling'
      scale.value = withTiming(1, { duration: 80 });
      opacity.value = withTiming(1, { duration: 80 });
    }
  }, [data.status]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Y position runs entirely on the UI thread via yAnim (SharedValue).
   * scale / opacity / shakeX also run on the UI thread.
   * No JS involvement during normal tile motion → zero jank on tap.
   */
  const animStyle = useAnimatedStyle(() => ({
    top: yAnim.value - TILE_RADIUS,
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (data.status !== 'falling') return;
    onTap(data);
  };

  return (
    <Animated.View
      style={[
        styles.tile,
        { left: data.x - TILE_RADIUS, backgroundColor: bgColor },
        animStyle,
      ]}
    >
      <Pressable style={styles.pressable} onPress={handlePress} hitSlop={8}>
        <Text style={[styles.num, { color: textColor }]}>{data.num}</Text>
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
