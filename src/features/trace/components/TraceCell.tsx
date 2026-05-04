import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/game/config/colors';
import type { ColorId } from '@/game/config/colors';
import type { TracePathStatus } from '@/features/trace/store/traceStore';
import { mazeCellStyles as styles } from '@/features/maze/styles/maze.styles';

interface Props {
  isFigureCell: boolean;
  figureColorId: ColorId;
  size: number;
  isInPath: boolean;
  isPathStart: boolean;
  pathStatus: TracePathStatus;
}

const SUCCESS_COLOR = '#4CAF50';
const FAIL_COLOR = '#E57373';
const INACTIVE_BG = '#E8E4DE';

export const TraceCell = React.memo(function TraceCell({
  isFigureCell,
  figureColorId,
  size,
  isInPath,
  isPathStart,
  pathStatus,
}: Props) {
  const colorDef = COLORS[figureColorId];

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

  if (!isFigureCell) {
    return (
      <View
        style={[
          styles.cell,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
            backgroundColor: INACTIVE_BG,
            opacity: 0.45,
          },
        ]}
      />
    );
  }

  const bgOpacity = isInPath ? 1 : 0.28;
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
      <Animated.View
        style={[styles.flashOverlay, { borderRadius: size * 0.22 }, flashStyle]}
        pointerEvents="none"
      />
    </Animated.View>
  );
});
