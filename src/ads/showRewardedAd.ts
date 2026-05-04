import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { getRewardedAdUnitId, isGoogleMobileAdsAvailable } from '@/ads/adMob';

const LOAD_TIMEOUT_MS = 22_000;

/**
 * Carica e mostra un rewarded; risolve `true` se l’utente ha guadagnato il reward.
 * `false` se SDK assente, errore, timeout o chiusura senza reward.
 */
export function showRewardedAd(): Promise<boolean> {
  if (!isGoogleMobileAdsAvailable()) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    let settled = false;
    let earned = false;
    const unsubs: Array<() => void> = [];

    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      unsubs.forEach((u) => u());
      resolve(ok);
    };

    const timeoutId = setTimeout(() => finish(false), LOAD_TIMEOUT_MS);

    const rewarded = RewardedAd.createForAdRequest(getRewardedAdUnitId(), {
      requestNonPersonalizedAdsOnly: true,
    });

    unsubs.push(
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show().catch(() => finish(false));
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        finish(earned);
      }),
    );

    unsubs.push(
      rewarded.addAdEventListener(AdEventType.ERROR, () => {
        finish(false);
      }),
    );

    rewarded.load();
  });
}
