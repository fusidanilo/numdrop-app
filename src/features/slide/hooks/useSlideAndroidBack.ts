import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useSlideStore } from '@/features/slide/store/slideStore';

export function useSlideAndroidBack(openPauseMenu: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (useSlideStore.getState().status !== 'playing') return false;
      if (useSlideStore.getState().isPaused) {
        useSlideStore.getState().setPaused(false);
      } else {
        openPauseMenu();
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [openPauseMenu]);
}
