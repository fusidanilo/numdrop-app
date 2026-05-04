import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useTraceStore } from '@/features/trace/store/traceStore';

export function useTraceAndroidBack(openPauseMenu: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (useTraceStore.getState().status !== 'playing') return false;
      if (useTraceStore.getState().isPaused) {
        useTraceStore.getState().setPaused(false);
      } else {
        openPauseMenu();
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [openPauseMenu]);
}
