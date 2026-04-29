import type { ColorId } from '@/game/config/colors';
import { COLOR_ORDER } from '@/game/config/colors';

let _idCounter = 0;

export type TileStatus = 'falling' | 'hit' | 'miss';

export interface TileData {
  id: string;
  colorId: ColorId;
  num: number;
  /** Absolute pixel x of the tile centre */
  x: number;
  /** Absolute pixel y of the tile centre (negative = above screen) */
  y: number;
  status: TileStatus;
}

/**
 * Spawn a new tile.
 *
 * 60% of the time it carries the "needed" number for its colour so the player
 * can progress; 40% of the time it's a distractor.  This ratio ensures the
 * game is winnable but keeps the field visually busy.
 */
export function spawnTile(
  nextByColor: Record<ColorId, number>,
  numColors: number,
  screenWidth: number,
  tileRadius: number,
): TileData {
  const available = COLOR_ORDER.slice(0, numColors);
  const colorId = available[Math.floor(Math.random() * available.length)];

  const next = nextByColor[colorId];
  const isNext = Math.random() < 0.65;

  let num: number;
  if (isNext) {
    num = next;
  } else {
    const candidates = Array.from({ length: 9 }, (_, i) => i + 1).filter((n) => n !== next);
    num = candidates[Math.floor(Math.random() * candidates.length)];
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
  };
}

/** Reset the counter (call on game start to keep IDs short) */
export function resetSpawnerCounter(): void {
  _idCounter = 0;
}
