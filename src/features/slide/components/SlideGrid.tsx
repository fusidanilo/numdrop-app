import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import { legalMoves } from '@/features/slide/engine/slidePuzzle';
import { useSlideStore } from '@/features/slide/store/slideStore';
import { SLIDE_GRID_SIZE } from '@/features/slide/config/slideCampaign';
import { slideGridStyles as styles } from '@/features/slide/styles/slide.styles';

const CELL_GAP = 8;

interface Props {
  /** Outer width/height of the whole grid in pixels (from screen layout). */
  outerSize: number;
}

export function SlideGrid({ outerSize }: Props) {
  const board = useSlideStore((s) => s.board);
  const k = SLIDE_GRID_SIZE;
  const status = useSlideStore((s) => s.status);
  const isPaused = useSlideStore((s) => s.isPaused);
  const tryTapCell = useSlideStore((s) => s.tryTapCell);

  const legal = legalMoves(board, k);
  const cellSize = (outerSize - CELL_GAP * (k - 1)) / k;
  const stride = cellSize + CELL_GAP;
  const totalSize = k * cellSize + (k - 1) * CELL_GAP;

  const isInteractive = status === 'playing' && !isPaused;

  return (
    <View style={[styles.grid, { width: totalSize, height: totalSize }]}>
      {board.map((value, idx) => {
        const row = Math.floor(idx / k);
        const col = idx % k;
        const isBlank = value === 0;
        const isMovable = !isBlank && legal.includes(idx) && isInteractive;

        return (
          <View
            key={idx}
            style={[
              styles.cellWrapper,
              {
                width: cellSize,
                height: cellSize,
                top: row * stride,
                left: col * stride,
              },
            ]}
          >
            {isBlank ? (
              <View
                style={[
                  styles.tile,
                  styles.tileBlank,
                  { width: cellSize, height: cellSize },
                ]}
              />
            ) : (
              <SlideTile
                value={value}
                size={cellSize}
                gridSize={k}
                isMovable={isMovable}
                onPress={() => tryTapCell(idx)}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

interface TileProps {
  value: number;
  size: number;
  gridSize: number;
  isMovable: boolean;
  onPress: () => void;
}

function SlideTile({ value, size, gridSize, isMovable, onPress }: TileProps) {
  const colorId = COLOR_ORDER[(value - 1) % COLOR_ORDER.length];
  const colorDef = COLORS[colorId];

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!isMovable) return;
    scale.value = withSequence(
      withTiming(0.93, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.back(2)) }),
    );
    onPress();
  };

  const fontSize = gridSize <= 3 ? size * 0.38 : size * 0.34;

  return (
    <Pressable onPress={handlePress} style={{ width: size, height: size }}>
      <Animated.View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            backgroundColor: colorDef.tile,
            opacity: isMovable ? 1 : 0.7,
          },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            styles.tileNum,
            {
              fontSize,
              color: colorDef.text,
            },
          ]}
        >
          {value}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
