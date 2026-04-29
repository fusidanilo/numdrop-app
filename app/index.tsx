import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/game/store/gameStore';
import { COLORS, COLOR_ORDER } from '@/game/config/colors';
import { loadHighScore } from '@/game/utils/storage';
import { styles } from '@/styles/homeScreen.styles';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const highScore = useGameStore((s) => s.highScore);
  const setHighScore = useGameStore((s) => s.setHighScore);

  useEffect(() => {
    loadHighScore().then((hs) => {
      if (hs > 0) setHighScore(hs);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = () => {
    router.push('/game');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      {/* Decorative tile hints */}
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
            <Text style={[styles.decoNum, { color: COLORS[c].text }]}>
              {i + 1}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.title}>Numdrop</Text>
      <Text style={styles.subtitle}>Tap the right number{'\n'}for each colour — before it falls.</Text>

      {highScore > 0 && (
        <View style={styles.highScoreRow}>
          <Text style={styles.highScoreLabel}>Best</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
      )}

      <View style={styles.spacer} />

      {/* How to play */}
      <View style={styles.howTo}>
        {[
          { dot: COLORS.salmon.tile, text: 'Each colour has its own count starting at 1' },
          { dot: COLORS.mint.tile, text: 'Tap the next number for any colour before it exits' },
          { dot: COLORS.butter.tile, text: 'Miss the required tile and lose a life — 3 lives total' },
        ].map(({ dot, text }) => (
          <View key={text} style={styles.howToRow}>
            <View style={[styles.dot, { backgroundColor: dot }]} />
            <Text style={styles.howToText}>{text}</Text>
          </View>
        ))}
      </View>

      <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={handlePlay}>
        <Text style={styles.btnText}>Play</Text>
      </Pressable>
    </View>
  );
}
