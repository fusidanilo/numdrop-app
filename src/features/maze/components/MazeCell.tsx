import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/game/config/colors';
import type { MazeCell as MazeCellData } from '@/features/maze/store/mazeStore';
import type { PathStatus } from '@/features/maze/store/mazeStore';
import { mazeCellStyles as styles } from '@/features/maze/styles/maze.styles';

interface Props {
  cell: MazeCellData;
  size: number;
  isInPath: boolean;
  isPathStart: boolean;
  pathStatus: PathStatus;
}

const SUCCESS_COLOR = '#4CAF50';
const FAIL_COLOR = '#E57373';

export const MazeCell = React.memo(function MazeCell({
  cell,
  size,
  isInPath,
  isPathStart,
  pathStatus,
}: Props) {
  const { colorId, num } = cell;
  const colorDef = COLORS[colorId];

  const scale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const flashColor = useSharedValue(SUCCESS_COLOR);

  useEffect(() => {
    if (isInPath && pathStatus === 'success') {
      flashColor.value = SUCCESS_COLOR;
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
      );
      scale.value = withSequence(
        withTiming(1.12, { duration: 80 }),
        withTiming(1, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      );
    } else if (isInPath && pathStatus === 'fail') {
      flashColor.value = FAIL_COLOR;
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0, { duration: 400 }),
      );
      scale.value = withSequence(
        withTiming(0.9, { duration: 60 }),
        withTiming(1, { duration: 300 }),
      );
    }
  }, [pathStatus, isInPath]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: flashColor.value,
  }));

  const bgOpacity = isInPath ? 1 : 0.22;
  const borderWidth = isPathStart && isInPath ? 2.5 : isInPath ? 0 : 0;
  const borderColor = '#fff';

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: colorDef.tile,
          opacity: bgOpacity,
          borderWidth,
          borderColor,
        },
        containerStyle,
      ]}
    >
      <Text
        style={[
          styles.num,
          {
            fontSize: size * 0.38,
            color: isInPath ? colorDef.text : colorDef.text,
          },
        ]}
      >
        {num}
      </Text>

      {/* Flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { borderRadius: size * 0.22 }, flashStyle]}
        pointerEvents="none"
      />
    </Animated.View>
  );
});
