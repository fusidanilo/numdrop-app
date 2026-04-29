import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../src/game/store/gameStore';
import { COLORS, COLOR_ORDER } from '../src/game/config/colors';
import { loadHighScore } from '../src/game/utils/storage';

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

      <Text style={styles.title}>NumDrop</Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  deco: {
    flexDirection: 'row',
    marginBottom: 32,
    alignItems: 'center',
  },
  decoTile: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  decoNum: {
    fontSize: 26,
    fontWeight: '800',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2E2E2E',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  highScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#F0EDE8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  highScoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  highScoreValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3D3D3D',
  },
  spacer: { flex: 1 },
  howTo: {
    width: '100%',
    marginBottom: 32,
    gap: 10,
  },
  howToRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  howToText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  btn: {
    width: '100%',
    backgroundColor: '#3D3D3D',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnPressed: {
    opacity: 0.75,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FAF7F2',
    letterSpacing: 0.5,
  },
});
