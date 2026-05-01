import type { ColorId } from '@/game/config/colors';
import { COLOR_ORDER } from '@/game/config/colors';
import type { TierConfig } from '@/game/config/levels';

let _idCounter = 0;

export type TileStatus = 'falling' | 'hit' | 'miss';

/**
 * normal  — standard tile; may be the correct chain number or a distractor.
 * ghost   — number is visible briefly, then disappears (must memorise).
 * double  — tapping advances the colour chain by 2 instead of 1.
 * bomb    — must be tapped before crossing mid-screen or a life is lost.
 * bonus   — golden tile; tapping grants bonus score or a life (no chain involvement).
 */
export type TileKind = 'normal' | 'ghost' | 'double' | 'bomb' | 'bonus';

export interface TileData {
  id: string;
  colorId: ColorId;
  num: number;
  /** Absolute pixel x of the tile centre */
  x: number;
  /** Absolute pixel y of the tile centre (negative = above screen) */
  y: number;
  status: TileStatus;
  kind: TileKind;
}

/**
 * Roll a tile kind for the current tier.
 *
 * Approximate spawn rates:
 *   bonus  — 3 % (all tiers)
 *   bomb   — 5 % (tier 6+)
 *   ghost  — 10 % (tier 4+)
 *   double — 8 % (tier 5+)
 *   normal — remainder
 */
function rollKind(cfg: TierConfig): TileKind {
  const r = Math.random();
  if (r < 0.03)                       return 'bonus';
  if (cfg.bombTiles   && r < 0.08)    return 'bomb';
  if (cfg.ghostTiles  && r < 0.18)    return 'ghost';
  if (cfg.doubleTiles && r < 0.26)    return 'double';
  return 'normal';
}

/**
 * Spawn a new tile using the full tier config.
 *
 * Special-kind tiles (ghost, double, bomb) always carry the colour's next
 * needed number so they are always meaningful to tap.
 * Bonus tiles use num = 0 (sentinel; the Tile component renders a star).
 * Normal tiles follow the existing 65/35 correct/distractor ratio.
 */
export function spawnTile(
  nextByColor: Record<ColorId, number>,
  cfg: TierConfig,
  screenWidth: number,
  tileRadius: number,
): TileData {
  const available = COLOR_ORDER.slice(0, cfg.numColors);
  const colorId = available[Math.floor(Math.random() * available.length)];

  const kind = rollKind(cfg);

  let num: number;
  if (kind === 'bonus') {
    num = 0; // sentinel — Tile component renders '★'
  } else if (kind === 'ghost' || kind === 'double' || kind === 'bomb') {
    // Meaningful special tiles always show the next needed number
    num = nextByColor[colorId];
  } else {
    const next = nextByColor[colorId];
    const isNext = Math.random() < 0.65;
    if (isNext) {
      num = next;
    } else {
      const candidates = Array.from({ length: cfg.maxNum }, (_, i) => i + 1).filter(
        (n) => n !== next,
      );
      num = candidates[Math.floor(Math.random() * candidates.length)];
    }
  }

  const margin = tileRadius * 1.6;
  const x = margin + Math.random() * (screenWidth - margin * 2);

  return {
    id: `t${++_idCounter}`,
    colorId,
    num,
    x,
    y: -tileRadius,
    status: 'falling',
    kind,
  };
}

/** Reset the counter (call on game start to keep IDs short). */
export function resetSpawnerCounter(): void {
  _idCounter = 0;
}
