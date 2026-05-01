import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useGameStore } from '@/game/store/gameStore';
import { feedbackGameOver } from '@/game/utils/sound';
import { saveHighScore, loadHighScore } from '@/game/utils/storage';

export function useNavigateWhenGameOver(status: string) {
  const router = useRouter();
  const setHighScore = useGameStore((s) => s.setHighScore);
  const prevStatusRef = useRef<string>('idle');

  useEffect(() => {
    if (status === 'over' && prevStatusRef.current === 'playing') {
      feedbackGameOver();
      const finalScore = useGameStore.getState().score;
      loadHighScore().then((stored) => {
        const best = Math.max(stored, finalScore);
        saveHighScore(best);
        setHighScore(best);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/gameover' as any);
      });
    }
    prevStatusRef.current = status;
  }, [status, router, setHighScore]);
}
