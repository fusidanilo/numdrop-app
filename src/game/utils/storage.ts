import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'numdrop_high_score';

/** Migrazione da nomi precedenti del progetto */
const LEGACY_KEYS = ['rainorder_high_score', 'counterpoint_high_score'] as const;

export async function loadHighScore(): Promise<number> {
  try {
    const primary = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    if (primary != null && primary !== '') {
      const n = parseInt(primary, 10);
      return Number.isNaN(n) ? 0 : n;
    }

    for (const legacyKey of LEGACY_KEYS) {
      const raw = await AsyncStorage.getItem(legacyKey);
      if (raw != null && raw !== '') {
        const score = parseInt(raw, 10);
        if (!Number.isNaN(score)) {
          await AsyncStorage.setItem(HIGH_SCORE_KEY, String(score));
          await AsyncStorage.removeItem(legacyKey);
          return score;
        }
      }
    }

    return 0;
  } catch {
    return 0;
  }
}

export async function saveHighScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // Ignora errori di storage
  }
}
