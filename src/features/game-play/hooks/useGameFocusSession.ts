import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useGameStore } from '@/game/store/gameStore';

export function useGameFocusSession(resetSessionIdle: () => void) {
  useFocusEffect(
    useCallback(() => {
      const currentStatus = useGameStore.getState().status;
      if (currentStatus === 'over') {
        useGameStore.setState({ status: 'idle' });
      }
      return () => {
        if (useGameStore.getState().status === 'playing') {
          resetSessionIdle();
        }
      };
    }, [resetSessionIdle]),
  );
}
