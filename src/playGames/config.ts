import Constants from 'expo-constants';

type Extra = {
  playGamesLeaderboardId?: string;
  playGamesSnapshotName?: string;
};

function readExtra(): Extra {
  const extra = Constants.expoConfig?.extra as Extra | undefined;
  return extra ?? {};
}

/** Leaderboard resource id from Play Console (e.g. `CgkI…`). Empty = no score submit. */
export function getPlayGamesLeaderboardId(): string {
  const v = readExtra().playGamesLeaderboardId;
  return typeof v === 'string' ? v.trim() : '';
}

/** Saved Games snapshot file name (one slot per Play Games account). */
export function getPlayGamesSnapshotName(): string {
  const v = readExtra().playGamesSnapshotName;
  const s = typeof v === 'string' ? v.trim() : '';
  return s.length > 0 ? s : 'numdrop-progress';
}
