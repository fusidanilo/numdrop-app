export interface TierConfig {
  numColors: 2 | 3;
  maxNum: number;
  /** ms for a tile to traverse full screen height */
  fallDuration: number;
  /** ms between consecutive tile spawns */
  spawnInterval: number;
  /** base score multiplier applied to combo */
  basePoints: number;
}

export const TIERS: TierConfig[] = [
  // Tier 0  — 0–30s: 2 colours, gentle start
  { numColors: 2, maxNum: 9, fallDuration: 4200, spawnInterval: 1300, basePoints: 10 },
  // Tier 1  — 30–60s: a bit faster
  { numColors: 2, maxNum: 9, fallDuration: 3400, spawnInterval: 1050, basePoints: 10 },
  // Tier 2  — 60–120s: third colour enters
  { numColors: 3, maxNum: 9, fallDuration: 2900, spawnInterval: 900, basePoints: 12 },
  // Tier 3  — 120s+: fast with three colours
  { numColors: 3, maxNum: 9, fallDuration: 2300, spawnInterval: 740, basePoints: 15 },
];

export const TIER_THRESHOLDS_MS = [0, 30_000, 60_000, 120_000];

export function getTierIndex(elapsedMs: number): number {
  let idx = 0;
  for (let i = 0; i < TIER_THRESHOLDS_MS.length; i++) {
    if (elapsedMs >= TIER_THRESHOLDS_MS[i]) idx = i;
  }
  return Math.min(idx, TIERS.length - 1);
}

export function getTierConfig(elapsedMs: number): TierConfig {
  return TIERS[getTierIndex(elapsedMs)];
}
