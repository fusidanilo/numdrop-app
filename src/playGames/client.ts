import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

import type {
  ExpoPlayGamesModuleType,
  PlayGamesAuthStatus,
  PlayGamesPlayer,
} from 'expo-play-games';
import { getComponentLogger } from '@/utils/logging/logger';

const log = getComponentLogger('PlayGames');

const native = requireOptionalNativeModule<ExpoPlayGamesModuleType>('ExpoPlayGames');

/** True when the native TurboModule is present (dev client / release build), not Expo Go. */
export const isPlayGamesNativeAvailable = Platform.OS === 'android' && native != null;

/**
 * Saved Games snapshot API (load/save) exists on this native binary.
 * If false while `isPlayGamesNativeAvailable` is true, the installed app was built before
 * those native methods were added — run a clean native rebuild (`npm run native:regen`, then `expo run:android` or a new EAS dev build).
 */
export const isPlayGamesCloudSnapshotAvailable =
  Platform.OS === 'android' &&
  native != null &&
  typeof native.loadCloudSnapshot === 'function' &&
  typeof native.saveCloudSnapshot === 'function';

log.info(
  `bootstrap platform=${Platform.OS} nativeModule=${native != null ? 'yes' : 'no'} → playGamesAvailable=${isPlayGamesNativeAvailable} cloudSnapshots=${isPlayGamesCloudSnapshotAvailable}`
);

export async function playGamesIsAuthenticated(): Promise<PlayGamesAuthStatus> {
  if (!native) {
    log.debug('isAuthenticated: skipped (no native module)');
    return { isAuthenticated: false };
  }
  try {
    log.debug('isAuthenticated: calling native…');
    const r = await native.isAuthenticated();
    log.info('isAuthenticated: result', r);
    return r;
  } catch (e) {
    log.error('isAuthenticated: native error', e);
    throw e;
  }
}

export async function playGamesSignIn(): Promise<void> {
  if (!native) {
    log.debug('signIn: skipped (no native module)');
    return;
  }
  try {
    log.info('signIn: starting interactive sign-in…');
    await native.signIn();
    log.info('signIn: native signIn finished');
  } catch (e) {
    log.error('signIn: failed', e);
    throw e;
  }
}

/**
 * Saved Games needs an authenticated Play Games session (see `GamesSignInClient.signIn()` → `AuthenticationResult`).
 * Returns whether the player is authenticated after any prompt.
 */
export async function ensurePlayGamesSignedInForCloud(): Promise<boolean> {
  if (!isPlayGamesCloudSnapshotAvailable) {
    return false;
  }
  try {
    const { isAuthenticated } = await playGamesIsAuthenticated();
    if (isAuthenticated) {
      log.debug('ensureSignedInForCloud: already authenticated');
      return true;
    }
    log.info('ensureSignedInForCloud: requesting Play Games sign-in for Saved Games');
    await playGamesSignIn();
    // Native `signIn` only resolves when `AuthenticationResult.isAuthenticated` is true. A follow-up
    // `isAuthenticated()` can still be false briefly (Play Services propagation), which wrongly skipped cloud merge.
    return true;
  } catch (e) {
    log.debug('ensureSignedInForCloud: sign-in incomplete', e);
    try {
      const { isAuthenticated } = await playGamesIsAuthenticated();
      return isAuthenticated;
    } catch {
      return false;
    }
  }
}

export async function playGamesGetCurrentPlayer(): Promise<PlayGamesPlayer | null> {
  if (!native) {
    log.debug('getCurrentPlayer: skipped (no native module)');
    return null;
  }
  try {
    log.debug('getCurrentPlayer: calling native…');
    const p = await native.getCurrentPlayer();
    if (p) {
      log.info('getCurrentPlayer: ok', { playerId: p.playerId, displayName: p.displayName });
    } else {
      log.warn('getCurrentPlayer: null (not signed in or no profile)');
    }
    return p;
  } catch (e) {
    log.error('getCurrentPlayer: native error', e);
    throw e;
  }
}

/** Submit a score to a Play Games leaderboard (Android only). */
export async function playGamesSubmitLeaderboardScore(leaderboardId: string, score: number): Promise<void> {
  if (!native || !leaderboardId.trim()) {
    log.debug('submitLeaderboardScore: skipped', { hasNative: Boolean(native), leaderboardId });
    return;
  }
  try {
    log.info('submitLeaderboardScore', { leaderboardId, score });
    await native.submitLeaderboardScore(leaderboardId, score);
    log.info('submitLeaderboardScore: native ok');
  } catch (e) {
    log.error('submitLeaderboardScore: failed', e);
    throw e;
  }
}

/**
 * Opens the native leaderboards UI.
 * If `leaderboardId` is empty, opens the all-leaderboards screen.
 */
export async function playGamesShowLeaderboard(leaderboardId?: string | null): Promise<void> {
  if (!native) {
    log.debug('showLeaderboard: skipped (no native module)');
    return;
  }
  try {
    log.info('showLeaderboard', { leaderboardId: leaderboardId ?? '(all)' });
    await native.showLeaderboard(leaderboardId ?? null);
    log.info('showLeaderboard: intent launched');
  } catch (e) {
    log.error('showLeaderboard: failed', e);
    throw e;
  }
}

/** Load snapshot payload as UTF-8 (empty string if new/empty). */
export async function playGamesLoadCloudSnapshot(
  name: string,
  createIfNotFound = false
): Promise<string> {
  if (!native) {
    log.debug('loadCloudSnapshot: skipped (no native module)');
    return '';
  }
  if (typeof native.loadCloudSnapshot !== 'function') {
    log.error(
      'loadCloudSnapshot: missing on native module (outdated Android build). Rebuild the app after updating expo-play-games, e.g. `npm run native:regen` then `npx expo run:android` or a fresh EAS development build.'
    );
    return '';
  }
  try {
    log.info('loadCloudSnapshot', { name, createIfNotFound });
    const r = await native.loadCloudSnapshot(name, createIfNotFound);
    const data = r.data ?? '';
    log.info('loadCloudSnapshot: ok', { bytes: data.length });
    return data;
  } catch (e) {
    log.error('loadCloudSnapshot: failed', e);
    throw e;
  }
}

/** Save UTF-8 payload (e.g. JSON) to Play Games Saved Games. */
export async function playGamesSaveCloudSnapshot(
  name: string,
  description: string,
  data: string,
  createIfNotFound = true
): Promise<void> {
  if (!native) {
    log.debug('saveCloudSnapshot: skipped (no native module)');
    return;
  }
  if (typeof native.saveCloudSnapshot !== 'function') {
    log.error(
      'saveCloudSnapshot: missing on native module (outdated Android build). Rebuild the app after updating expo-play-games, e.g. `npm run native:regen` then `npx expo run:android` or a fresh EAS development build.'
    );
    return;
  }
  try {
    log.info('saveCloudSnapshot', { name, createIfNotFound, bytes: data.length, description });
    await native.saveCloudSnapshot(name, description, data, createIfNotFound);
    log.info('saveCloudSnapshot: native commit ok');
  } catch (e) {
    log.error('saveCloudSnapshot: failed', e);
    throw e;
  }
}
