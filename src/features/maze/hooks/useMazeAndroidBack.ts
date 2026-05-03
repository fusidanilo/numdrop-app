import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useMazeStore } from '@/features/maze/store/mazeStore';

/** Playing: first back opens pause; second back closes pause. Swallows back while on Path gameplay. */
export function useMazeAndroidBack(openPauseMenu: () => void) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (useMazeStore.getState().status !== 'playing') return false;
      if (useMazeStore.getState().isPaused) {
        useMazeStore.getState().setPaused(false);
      } else {
        openPauseMenu();
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [openPauseMenu]);
}
