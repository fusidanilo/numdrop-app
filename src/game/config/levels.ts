export interface TierConfig {
  numColors: 2 | 3;
  maxNum: number;
  /** ms for a tile to traverse full screen height */
  fallDuration: number;
  /** ms between consecutive tile spawns */
  spawnInterval: number;
  /** base score per correct tap (multiplied by combo) */
  basePoints: number;
  /** ghost tiles: number fades out after a short delay */
  ghostTiles: boolean;
  /** double tiles: advance the chain by 2 when tapped */
  doubleTiles: boolean;
  /** bomb tiles: must be tapped before crossing mid-screen or a life is lost */
  bombTiles: boolean;
}

/**
 * 7-tier base cycle.
 * After tier 6 the game repeats the cycle with progressively tighter params
 * (faster falls, shorter spawn gaps, lower maxNum, higher base points).
 */
const BASE_TIERS: TierConfig[] = [
  // Tier 0 — 0–30 s: 2 colors, gentle start
  { numColors: 2, maxNum: 9, fallDuration: 4200, spawnInterval: 1300, basePoints: 10, ghostTiles: false, doubleTiles: false, bombTiles: false },
  // Tier 1 — 30–60 s: 2 colors, a bit faster
  { numColors: 2, maxNum: 9, fallDuration: 3400, spawnInterval: 1050, basePoints: 10, ghostTiles: false, doubleTiles: false, bombTiles: false },
  // Tier 2 — 60–120 s: 3rd color enters
  { numColors: 3, maxNum: 9, fallDuration: 2900, spawnInterval:  900, basePoints: 12, ghostTiles: false, doubleTiles: false, bombTiles: false },
  // Tier 3 — 120–180 s: speed ++
  { numColors: 3, maxNum: 9, fallDuration: 2300, spawnInterval:  740, basePoints: 15, ghostTiles: false, doubleTiles: false, bombTiles: false },
  // Tier 4 — 180–240 s: ghost tiles introduced
  { numColors: 3, maxNum: 9, fallDuration: 2100, spawnInterval:  680, basePoints: 18, ghostTiles: true,  doubleTiles: false, bombTiles: false },
  // Tier 5 — 240–300 s: double tiles introduced
  { numColors: 3, maxNum: 9, fallDuration: 1900, spawnInterval:  620, basePoints: 20, ghostTiles: true,  doubleTiles: true,  bombTiles: false },
  // Tier 6 — 300–360 s: bomb tiles introduced, speed +++
  { numColors: 3, maxNum: 9, fallDuration: 1700, spawnInterval:  560, basePoints: 22, ghostTiles: true,  doubleTiles: true,  bombTiles: true  },
];

export const TIERS_PER_CYCLE = BASE_TIERS.length; // 7

const MIN_FALL_MS   = 1200;
const MIN_SPAWN_MS  =  400;
const MS_PER_TIER   = 60_000;

/** Fixed thresholds for the first cycle; exported for reference. */
export const TIER_THRESHOLDS_MS = [0, 30_000, 60_000, 120_000, 180_000, 240_000, 300_000];

export function getTierIndex(elapsedMs: number): number {
  const cycleStartMs = TIER_THRESHOLDS_MS[TIERS_PER_CYCLE - 1]; // 300 000 ms

  if (elapsedMs < cycleStartMs) {
    let idx = 0;
    for (let i = 0; i < TIER_THRESHOLDS_MS.length; i++) {
      if (elapsedMs >= TIER_THRESHOLDS_MS[i]) idx = i;
    }
    return idx;
  }

  // Beyond tier 6: one new tier every MS_PER_TIER (60 s)
  const extra = Math.floor((elapsedMs - cycleStartMs) / MS_PER_TIER);
  return TIERS_PER_CYCLE - 1 + extra; // 6, 7, 8, …
}

export function getTierConfig(elapsedMs: number): TierConfig {
  const tier  = getTierIndex(elapsedMs);
  const phase = Math.floor(tier / TIERS_PER_CYCLE); // 0 = first pass, 1 = second, …
  const base  = BASE_TIERS[tier % TIERS_PER_CYCLE];

  if (phase === 0) return base;

  return {
    ...base,
    fallDuration:  Math.max(MIN_FALL_MS,  base.fallDuration  - phase * 100),
    spawnInterval: Math.max(MIN_SPAWN_MS, base.spawnInterval - phase *  50),
    basePoints:    base.basePoints + phase * 5,
    maxNum:        Math.max(5, base.maxNum - phase),
    // All special tile types are active in every cycle after the first
    ghostTiles:  true,
    doubleTiles: true,
    bombTiles:   true,
  };
}
