import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useMazeStore } from '@/features/maze/store/mazeStore';
import { MazeCell } from '@/features/maze/components/MazeCell';
import { mazeGridStyles as styles } from '@/features/maze/styles/maze.styles';

const GRID_COLS = 4;
const CELL_GAP = 10;

interface Props {
  gridSize: number;
}

export function MazeGrid({ gridSize }: Props) {
  const grid = useMazeStore((s) => s.grid);
  const currentPath = useMazeStore((s) => s.currentPath);
  const pathStatus = useMazeStore((s) => s.pathStatus);
  const startPath = useMazeStore((s) => s.startPath);
  const extendPath = useMazeStore((s) => s.extendPath);
  const submitPath = useMazeStore((s) => s.submitPath);

  const cellSize = (gridSize - CELL_GAP * (GRID_COLS - 1)) / GRID_COLS;
  const stride = cellSize + CELL_GAP;

  // Compute which grid cell sits under the given (x, y) relative to the grid container.
  const cellAt = useCallback(
    (x: number, y: number) => {
      const col = Math.floor(x / stride);
      const row = Math.floor(y / stride);
      if (row >= 0 && row < GRID_COLS && col >= 0 && col < GRID_COLS) {
        return { row, col };
      }
      return null;
    },
    [stride],
  );

  // Track last seen cell to avoid redundant state updates on every pixel move.
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      const cell = cellAt(e.x, e.y);
      lastCellRef.current = cell;
      startPath(cell);
    })
    .onUpdate((e) => {
      const cell = cellAt(e.x, e.y);
      if (!cell) return;
      const last = lastCellRef.current;
      if (last && last.row === cell.row && last.col === cell.col) return;
      lastCellRef.current = cell;
      extendPath(cell);
    })
    .onEnd(() => {
      lastCellRef.current = null;
      submitPath();
    })
    .onFinalize(() => {
      lastCellRef.current = null;
    })
    .runOnJS(true);

  const pathSet = new Set(currentPath.map((p) => `${p.row},${p.col}`));
  const pathStart =
    currentPath.length > 0 ? `${currentPath[0].row},${currentPath[0].col}` : null;

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.grid, { width: gridSize, height: gridSize }]}>
        {grid.map((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri},${ci}`;
            const isInPath = pathSet.has(key);
            const isPathStart = pathStart === key;

            return (
              <View
                key={key}
                style={[
                  styles.cellWrapper,
                  {
                    width: cellSize,
                    height: cellSize,
                    top: ri * stride,
                    left: ci * stride,
                  },
                ]}
                pointerEvents="none"
              >
                <MazeCell
                  cell={cell}
                  size={cellSize}
                  isInPath={isInPath}
                  isPathStart={isPathStart}
                  pathStatus={pathStatus}
                />
              </View>
            );
          }),
        )}

        {/* Path connector lines */}
        {currentPath.length > 1 && (
          <PathLines path={currentPath} stride={stride} cellSize={cellSize} />
        )}
      </View>
    </GestureDetector>
  );
}

function PathLines({
  path,
  stride,
  cellSize,
}: {
  path: { row: number; col: number }[];
  stride: number;
  cellSize: number;
}) {
  const halfCell = cellSize / 2;

  return (
    <>
      {path.slice(1).map((to, i) => {
        const from = path[i];
        const x1 = from.col * stride + halfCell;
        const y1 = from.row * stride + halfCell;
        const x2 = to.col * stride + halfCell;
        const y2 = to.row * stride + halfCell;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const midX = (x1 + x2) / 2 - length / 2;
        const midY = (y1 + y2) / 2 - 2;

        return (
          <View
            key={`line-${i}`}
            pointerEvents="none"
            style={[
              styles.line,
              {
                width: length,
                top: midY,
                left: midX,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
    </>
  );
}
