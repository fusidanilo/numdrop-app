import { useEffect } from 'react';
import { useGameStore } from '@/game/store/gameStore';
import { loadHighScore } from '@/game/utils/storage';
import { mergeHighScoreWithPlayGamesCloud } from '@/playGames/persistence';

export function useHydrateHighScore() {
  const setHighScore = useGameStore((s) => s.setHighScore);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hs = await loadHighScore();
      if (cancelled) return;
      // Show classic "best" immediately from disk (Path mode already does this via mazeStore.loadHighScore).
      if (hs > 0) {
        setHighScore(hs);
      }
      let best = hs;
      try {
        best = await mergeHighScoreWithPlayGamesCloud(hs);
      } catch {
        // Play Games cloud is optional
      }
      if (cancelled) return;
      if (best > 0) setHighScore(best);
    })();
    return () => {
      cancelled = true;
    };
  }, [setHighScore]);
}
