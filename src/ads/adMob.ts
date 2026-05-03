import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
/** Google test app open (Android / iOS). */
const TEST_APP_OPEN_ANDROID = 'ca-app-pub-3940256099942544/9257395921';
const TEST_APP_OPEN_IOS = 'ca-app-pub-3940256099942544/5575463023';

/** Turbo Modules are not always mirrored onto `NativeModules` (e.g. bridgeless). */
const hasGoogleAdsNativeModule = Boolean(
  NativeModules.RNGoogleMobileAdsModule ??
    TurboModuleRegistry.get('RNGoogleMobileAdsModule'),
);

const IOS_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID;
const ANDROID_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID;
const IOS_APP_OPEN_ID = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_OPEN_ID;
const ANDROID_APP_OPEN_ID = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN_ID;

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

export const getAppOpenAdUnitId = (): string => {
  if (__DEV__ || !hasGoogleAdsNativeModule) {
    return Platform.OS === 'ios' ? TEST_APP_OPEN_IOS : TEST_APP_OPEN_ANDROID;
  }

  const unitId = Platform.select({
    ios: IOS_APP_OPEN_ID,
    android: ANDROID_APP_OPEN_ID,
    default: undefined,
  });

  return unitId || (Platform.OS === 'ios' ? TEST_APP_OPEN_IOS : TEST_APP_OPEN_ANDROID);
};

export const isGoogleMobileAdsAvailable = () => hasGoogleAdsNativeModule;
