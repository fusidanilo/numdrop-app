export type PlayGamesAuthStatus = {
  isAuthenticated: boolean;
};

export type PlayGamesPlayer = {
  playerId: string;
  displayName: string;
  title: string;
};

export type PlayGamesSnapshotLoadResult = {
  data: string;
};

export type ExpoPlayGamesModuleType = {
  isAuthenticated(): Promise<PlayGamesAuthStatus>;
  signIn(): Promise<void | null>;
  getCurrentPlayer(): Promise<PlayGamesPlayer | null>;
  submitLeaderboardScore(leaderboardId: string, score: number): Promise<void | null>;
  showLeaderboard(leaderboardId: string | null): Promise<void | null>;
  loadCloudSnapshot(name: string, createIfNotFound: boolean): Promise<PlayGamesSnapshotLoadResult>;
  saveCloudSnapshot(
    name: string,
    description: string,
    data: string,
    createIfNotFound: boolean
  ): Promise<void | null>;
};
