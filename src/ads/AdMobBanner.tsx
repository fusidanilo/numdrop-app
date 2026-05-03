import React from 'react';
import { getBannerAdUnitId, isGoogleMobileAdsAvailable } from '@/ads/adMob';

/** Standard AdMob banner; renders nothing when the native module is unavailable (e.g. Expo Go). */
export function AdMobBanner() {
  if (!isGoogleMobileAdsAvailable()) {
    return null;
  }

  const adsModule = require('react-native-google-mobile-ads') as typeof import('react-native-google-mobile-ads');
  const { BannerAd, BannerAdSize } = adsModule;

  return <BannerAd unitId={getBannerAdUnitId()} size={BannerAdSize.BANNER} />;
}
