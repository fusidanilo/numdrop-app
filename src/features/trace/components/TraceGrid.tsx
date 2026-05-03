import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTraceStore } from '@/features/trace/store/traceStore';
import { TraceCell } from '@/features/trace/components/TraceCell';
import { mazeGridStyles as styles } from '@/features/maze/styles/maze.styles';

interface Props {
  /** Outer width/height of the grid in px. */
  gridSize: number;
}

export function TraceGrid({ gridSize }: Props) {
  const figureMask = useTraceStore((s) => s.figureMask);
  const figureColorId = useTraceStore((s) => s.figureColorId);
  const currentPath = useTraceStore((s) => s.currentPath);
  const pathStatus = useTraceStore((s) => s.pathStatus);
  const startPath = useTraceStore((s) => s.startPath);
  const extendPath = useTraceStore((s) => s.extendPath);
  const submitPath = useTraceStore((s) => s.submitPath);

  const cols = figureMask.length;
  const cellGap = cols >= 6 ? 6 : cols >= 5 ? 8 : 10;
  const cellSize = (gridSize - cellGap * (cols - 1)) / cols;
  const stride = cellSize + cellGap;

  const cellAt = useCallback(
    (x: number, y: number) => {
      const col = Math.floor(x / stride);
      const row = Math.floor(y / stride);
      if (row >= 0 && row < cols && col >= 0 && col < cols) {
        return { row, col };
      }
      return null;
    },
    [stride, cols],
  );

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
        {figureMask.map((row, ri) =>
          row.map((isFigure, ci) => {
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
                <TraceCell
                  isFigureCell={isFigure}
                  figureColorId={figureColorId}
                  size={cellSize}
                  isInPath={isInPath}
                  isPathStart={isPathStart}
                  pathStatus={pathStatus}
                />
              </View>
            );
          }),
        )}

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
