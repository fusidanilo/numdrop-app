import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useSlideStore } from '@/features/slide/store/slideStore';

const TICK_MS = 100;

export function useSlideTimer() {
  const status = useSlideStore((s) => s.status);
  const isPaused = useSlideStore((s) => s.isPaused);
  const tick = useSlideStore((s) => s.tick);
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== 'playing' || isPaused) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (status === 'won' || status === 'lost') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/slideover' as any);
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
