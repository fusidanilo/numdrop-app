import type { TFunction } from 'i18next';

const TIER_FLASH_KEY: Record<number, string> = {
  1: 'tier.level2',
  2: 'tier.level3Color',
  3: 'tier.maxSpeed',
  4: 'tier.ghost',
  5: 'tier.double',
  6: 'tier.bomb',
};

const TIERS_PER_CYCLE = 7;

export function getTierLabel(t: TFunction, tier: number): string {
  if (tier === 0) return '';
  const fixed = TIER_FLASH_KEY[tier];
  if (fixed) return t(fixed);
  const phase = Math.floor(tier / TIERS_PER_CYCLE) + 1;
  const pos = (tier % TIERS_PER_CYCLE) + 1;
  return t('tier.cycleLevel', { phase, pos });
}
