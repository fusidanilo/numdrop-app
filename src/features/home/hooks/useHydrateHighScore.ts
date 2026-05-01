import { useEffect } from 'react';
import { useGameStore } from '@/game/store/gameStore';
import { loadHighScore } from '@/game/utils/storage';

export function useHydrateHighScore() {
  const setHighScore = useGameStore((s) => s.setHighScore);

  useEffect(() => {
    loadHighScore().then((hs) => {
      if (hs > 0) setHighScore(hs);
    });
  }, [setHighScore]);
}
