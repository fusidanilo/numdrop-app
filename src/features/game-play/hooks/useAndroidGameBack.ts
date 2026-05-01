import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useGameStore } from '@/game/store/gameStore';

export function useAndroidGameBack(openPauseMenu: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (useGameStore.getState().status !== 'playing') return false;
      if (!useGameStore.getState().isPaused) {
        openPauseMenu();
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [openPauseMenu]);
}
