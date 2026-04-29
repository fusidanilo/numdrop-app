/**
 * Haptic feedback (expo-haptics) and short SFX (expo-av).
 */
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const WRONG_NUMBER_MP3 = require('../../../assets/audio/wrong-number.mp3');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const NEW_LEVEL_MP3 = require('../../../assets/audio/new-level.mp3');

let wrongSfx: Audio.Sound | null = null;
let loadWrongPromise: Promise<void> | null = null;
let newLevelSfx: Audio.Sound | null = null;
let loadNewLevelPromise: Promise<void> | null = null;
let sfxAudioModeReady = false;

async function ensureSfxAudioMode(): Promise<void> {
  if (sfxAudioModeReady) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    allowsRecordingIOS: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
  sfxAudioModeReady = true;
}

async function ensureWrongSfxLoaded(): Promise<Audio.Sound | null> {
  await ensureSfxAudioMode();
  if (wrongSfx) return wrongSfx;
  if (!loadWrongPromise) {
    loadWrongPromise = (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(WRONG_NUMBER_MP3, {
          shouldPlay: false,
          volume: 1,
        });
        wrongSfx = sound;
      } catch {
        wrongSfx = null;
      } finally {
        loadWrongPromise = null;
      }
    })();
  }
  await loadWrongPromise;
  return wrongSfx;
}

/** Warm decode when a run starts so the first wrong tap / level-up feels instant. */
export function preloadGameSfx(): void {
  void ensureWrongSfxLoaded();
  void ensureNewLevelSfxLoaded();
}

async function ensureNewLevelSfxLoaded(): Promise<Audio.Sound | null> {
  await ensureSfxAudioMode();
  if (newLevelSfx) return newLevelSfx;
  if (!loadNewLevelPromise) {
    loadNewLevelPromise = (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(NEW_LEVEL_MP3, {
          shouldPlay: false,
          volume: 1,
        });
        newLevelSfx = sound;
      } catch {
        newLevelSfx = null;
      } finally {
        loadNewLevelPromise = null;
      }
    })();
  }
  await loadNewLevelPromise;
  return newLevelSfx;
}

async function playNewLevelSfx(): Promise<void> {
  const sound = await ensureNewLevelSfxLoaded();
  if (!sound) return;
  try {
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return;
    await sound.replayAsync();
  } catch {
    /* ignore */
  }
}

export function feedbackNewLevel(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
  void playNewLevelSfx();
}

async function playWrongNumberSfx(): Promise<void> {
  const sound = await ensureWrongSfxLoaded();
  if (!sound) return;
  try {
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return;
    await sound.replayAsync();
  } catch {
    /* ignore */
  }
}

export function feedbackHit(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
}

export function feedbackMiss(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
  void playWrongNumberSfx();
}

export function feedbackLoseLife(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => null);
}

export function feedbackGameOver(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
}

export function feedbackComboMilestone(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
}
