import { useEffect } from 'react';
import { preloadGameSfx } from '@/game/utils/sound';

export function usePreloadGameSfx(status: string) {
  useEffect(() => {
    if (status === 'playing') {
      preloadGameSfx();
    }
  }, [status]);
}
