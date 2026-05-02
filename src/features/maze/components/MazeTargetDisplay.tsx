import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { COLORS } from '@/game/config/colors';
import type { MazeCell } from '@/features/maze/store/mazeStore';
import { mazeTargetStyles as styles } from '@/features/maze/styles/maze.styles';

interface Props {
  sequence: MazeCell[];
  currentPathLength: number;
}

export function MazeTargetDisplay({ sequence, currentPathLength }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>TRACE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {sequence.map((step, i) => {
          const colorDef = COLORS[step.colorId];
          const isDone = i < currentPathLength;
          const isCurrent = i === currentPathLength;

          return (
            <React.Fragment key={i}>
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor: isDone ? colorDef.tile : `${colorDef.tile}55`,
                    borderWidth: isCurrent ? 2 : 0,
                    borderColor: '#fff',
                    transform: [{ scale: isCurrent ? 1.1 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillNum,
                    { color: isDone ? colorDef.text : colorDef.text + '99' },
                  ]}
                >
                  {step.num}
                </Text>
              </View>
              {i < sequence.length - 1 && (
                <Text style={styles.arrow}>›</Text>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}
