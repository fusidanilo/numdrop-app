const TIER_LABELS: Record<number, string> = {
  1: 'Level 2',
  2: 'Level 3 — 3rd color!',
  3: 'Max speed!',
  4: '👻 Ghost tiles!',
  5: '×2 Double tiles!',
  6: '💣 Bomb tiles!',
};

export function getTierLabel(tier: number): string {
  if (tier === 0) return '';
  if (TIER_LABELS[tier]) return TIER_LABELS[tier];
  const TIERS_PER_CYCLE = 7;
  const phase = Math.floor(tier / TIERS_PER_CYCLE) + 1;
  const pos = (tier % TIERS_PER_CYCLE) + 1;
  return `Cycle ${phase} · Level ${pos}`;
}
