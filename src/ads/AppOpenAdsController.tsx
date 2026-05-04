import React, { useCallback, useEffect, useRef } from 'react';
import { useAppOpenAd, useForeground } from 'react-native-google-mobile-ads';
import { getAppOpenAdUnitId, isGoogleMobileAdsAvailable } from '@/ads/adMob';

/**
 * App open su ritorno da background (useForeground = solo background → active, no cold start).
 * La frequenza si regola da AdMob (mediation / line item / unit settings).
 */
export function AppOpenAdsController() {
  const unitId = isGoogleMobileAdsAvailable() ? getAppOpenAdUnitId() : null;
  const appOpen = useAppOpenAd(unitId);
  const appOpenRef = useRef(appOpen);
  appOpenRef.current = appOpen;

  const unitIdRef = useRef(unitId);
  unitIdRef.current = unitId;

  useEffect(() => {
    if (!unitId) return;
    appOpen.load();
  }, [unitId, appOpen.load]);

  useEffect(() => {
    if (!unitId) return;
    if (!appOpen.isClosed && !appOpen.error) return;
    appOpen.load();
  }, [unitId, appOpen.isClosed, appOpen.error, appOpen.load]);

  const onReturnFromBackground = useCallback(() => {
    const id = unitIdRef.current;
    if (!id) return;

    const a = appOpenRef.current;
    if (a.isShowing) return;

    if (a.isLoaded) {
      a.show();
    } else {
      a.load();
    }
  }, []);

  useForeground(onReturnFromBackground);

  return null;
}
