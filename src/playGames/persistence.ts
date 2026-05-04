import { saveHighScore } from '@/game/utils/storage';

import {
  getPlayGamesLeaderboardId,
  getPlayGamesSnapshotName,
} from '@/playGames/config';
import {
  ensurePlayGamesSignedInForCloud,
  isPlayGamesCloudSnapshotAvailable,
  isPlayGamesNativeAvailable,
  playGamesIsAuthenticated,
  playGamesLoadCloudSnapshot,
  playGamesSaveCloudSnapshot,
  playGamesSubmitLeaderboardScore,
} from '@/playGames/client';
import { getComponentLogger } from '@/utils/logging/logger';

const log = getComponentLogger('PlayGames');

const CLOUD_VERSION = 1 as const;

export type PlayGamesCloudProgressV1 = {
  v: typeof CLOUD_VERSION;
  highScore: number;
};

function parseCloudPayload(raw: string): PlayGamesCloudProgressV1 | null {
  if (!raw.trim()) {
    return null;
  }
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== 'object') {
      return null;
    }
    const v = (o as { v?: unknown }).v;
    const highScore = (o as { highScore?: unknown }).highScore;
    if (v !== CLOUD_VERSION || typeof highScore !== 'number' || !Number.isFinite(highScore)) {
      return null;
    }
    return { v: CLOUD_VERSION, highScore: Math.max(0, Math.floor(highScore)) };
  } catch {
    return null;
  }
}

/**
 * After reading local best score, try Play Games Saved Games and return the max.
 * No-ops when Play Games is unavailable or errors.
 */
export async function mergeHighScoreWithPlayGamesCloud(localBest: number): Promise<number> {
  if (!isPlayGamesCloudSnapshotAvailable) {
    log.debug(
      !isPlayGamesNativeAvailable
        ? 'mergeCloud: skipped (Play Games native not available)'
        : 'mergeCloud: skipped (cloud snapshot API missing on native binary — rebuild Android app)'
    );
    return localBest;
  }
  const name = getPlayGamesSnapshotName();
  log.info('mergeCloud: start', { snapshot: name, localBest });
  try {
    // Do not prompt interactive sign-in on cold start / home — that blocked showing the local best score.
    // Cloud merge runs only when already signed in; after a game, `syncPlayGamesAfterSession` can prompt.
    const { isAuthenticated } = await playGamesIsAuthenticated();
    if (!isAuthenticated) {
      log.debug('mergeCloud: skipping cloud load (not signed in to Play Games yet)');
      return localBest;
    }
    const raw = await playGamesLoadCloudSnapshot(name, false);
    const cloud = parseCloudPayload(raw);
    if (!cloud) {
      log.info('mergeCloud: no valid cloud payload', { rawLength: raw.length });
      return localBest;
    }
    const merged = Math.max(localBest, cloud.highScore);
    log.info('mergeCloud: parsed', { cloudHigh: cloud.highScore, merged });
    if (merged > localBest) {
      await saveHighScore(merged);
      log.info('mergeCloud: updated local AsyncStorage from cloud');
    }
    return merged;
  } catch (e) {
    log.warn('mergeCloud: failed (keeping local best)', e);
    return localBest;
  }
}

/**
 * After a session: push Saved Games snapshot (best) and optionally submit the run score to a leaderboard.
 */
export async function syncPlayGamesAfterSession(bestHighScore: number, runScore: number): Promise<void> {
  if (!isPlayGamesNativeAvailable) {
    log.debug('syncAfterSession: skipped (Play Games native not available)');
    return;
  }
  const snapshotName = getPlayGamesSnapshotName();
  const payload: PlayGamesCloudProgressV1 = { v: CLOUD_VERSION, highScore: bestHighScore };
  log.info('syncAfterSession: start', { snapshotName, bestHighScore, runScore });
  if (isPlayGamesCloudSnapshotAvailable) {
    try {
      const signedIn = await ensurePlayGamesSignedInForCloud();
      if (!signedIn) {
        log.debug('syncAfterSession: cloud save skipped (no authenticated Play Games session)');
      } else {
        await playGamesSaveCloudSnapshot(
          snapshotName,
          'NumDrop — best score',
          JSON.stringify(payload),
          true
        );
        log.info('syncAfterSession: cloud snapshot saved');
      }
    } catch (e) {
      log.warn('syncAfterSession: cloud save failed (ignored)', e);
    }
  } else if (isPlayGamesNativeAvailable) {
    log.debug('syncAfterSession: cloud save skipped (rebuild Android app for Saved Games API)');
  }

  const leaderboardId = getPlayGamesLeaderboardId();
  if (!leaderboardId || runScore <= 0) {
    log.debug('syncAfterSession: leaderboard submit skipped', { leaderboardId, runScore });
    return;
  }
  try {
    await playGamesSubmitLeaderboardScore(leaderboardId, Math.floor(runScore));
    log.info('syncAfterSession: leaderboard score submitted');
  } catch (e) {
    log.warn('syncAfterSession: leaderboard submit failed (ignored)', e);
  }
}
