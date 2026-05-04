import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTraceStore } from '@/features/trace/store/traceStore';

const TICK_MS = 100;

export function useTraceTimer() {
  const status = useTraceStore((s) => s.status);
  const isPaused = useTraceStore((s) => s.isPaused);
  const tick = useTraceStore((s) => s.tick);
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
        router.replace('/traceover' as any);
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
