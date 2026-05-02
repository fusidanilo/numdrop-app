import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/game/store/gameStore';
import { useMazeStore } from '@/features/maze/store/mazeStore';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import { useHydrateHighScore } from '@/features/home/hooks/useHydrateHighScore';
import { styles } from '@/features/home/styles/home.styles';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const highScore = useGameStore((s) => s.highScore);
  const mazeHighScore = useMazeStore((s) => s.highScore);
  const loadMazeHighScore = useMazeStore((s) => s.loadHighScore);

  useHydrateHighScore();

  useEffect(() => {
    void loadMazeHighScore();
  }, [loadMazeHighScore]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.deco}>
        {COLOR_ORDER.map((c, i) => (
          <View
            key={c}
            style={[
              styles.decoTile,
              {
                backgroundColor: COLORS[c].tile,
                marginLeft: i === 0 ? 0 : -12,
                transform: [{ rotate: `${(i - 1) * 8}deg` }],
              },
            ]}
          >
            <Text style={[styles.decoNum, { color: COLORS[c].text }]}>{i + 1}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.title}>Numdrop</Text>
      <Text style={styles.subtitle}>Choose a game mode</Text>

      <View style={styles.modeMenu}>
        <Pressable
          style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
          onPress={() => router.push('/game')}
        >
          <Text style={styles.modeName}>Classic</Text>
          <Text style={styles.modeDescription}>
            Falling tiles — tap the next number for each color before it leaves the screen.
          </Text>
          {highScore > 0 && (
            <View style={styles.modeBestRow}>
              <Text style={styles.modeBestLabel}>Best</Text>
              <Text style={styles.modeBestValue}>{highScore}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push('/maze' as any)}
        >
          <Text style={styles.modeName}>Path</Text>
          <Text style={styles.modeDescription}>
            Trace the color-and-number sequence by dragging across the grid before time runs out.
          </Text>
          {mazeHighScore > 0 && (
            <View style={styles.modeBestRow}>
              <Text style={styles.modeBestLabel}>Best</Text>
              <Text style={styles.modeBestValue}>{mazeHighScore}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
