import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useMazeStore } from '@/features/maze/store/mazeStore';

const TICK_MS = 100;

export function useMazeTimer() {
  const status = useMazeStore((s) => s.status);
  const isPaused = useMazeStore((s) => s.isPaused);
  const tick = useMazeStore((s) => s.tick);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== 'playing' || isPaused) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (status === 'over') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/mazeover' as any);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      tick(TICK_MS);
    }, TICK_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, isPaused, tick]);
}
