import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

/** Turbo Modules are not always mirrored onto `NativeModules` (e.g. bridgeless). */
const hasGoogleAdsNativeModule = Boolean(
  NativeModules.RNGoogleMobileAdsModule ??
    TurboModuleRegistry.get('RNGoogleMobileAdsModule'),
);

const IOS_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID;
const ANDROID_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID;

export const getBannerAdUnitId = () => {
  if (__DEV__ || !hasGoogleAdsNativeModule) {
    return TEST_BANNER_ID;
  }

  const unitId = Platform.select({
    ios: IOS_BANNER_ID,
    android: ANDROID_BANNER_ID,
    default: undefined,
  });

  // Keep serving test ads if unit IDs are not configured yet.
  return unitId || TEST_BANNER_ID;
};

export const isGoogleMobileAdsAvailable = () => hasGoogleAdsNativeModule;
