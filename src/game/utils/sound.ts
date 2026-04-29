/**
 * Haptic feedback wrapper.
 *
 * Audio (expo-audio) requires Expo SDK ≥54 native modules compiled in the
 * dev-client build.  For MVP we rely exclusively on haptics, which work in
 * any Expo Go / dev-client build.  Audio assets can be wired in post-MVP.
 */
import * as Haptics from 'expo-haptics';

export function feedbackHit(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
}

export function feedbackMiss(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => null);
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
