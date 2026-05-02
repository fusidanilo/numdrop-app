import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { feedbackNewLevel } from '@/game/utils/sound';
import { getTierLabel } from '@/features/game-play/tierLabels';

export function useTierUpFlash(tier: number, gameSessionId: number) {
  const { t, i18n } = useTranslation('game');
  const prevTierRef = useRef<number>(0);
  const [tierLabel, setTierLabel] = useState('');
  const tierFlashOpacity = useSharedValue(0);
  const tierFlashScale = useSharedValue(0.7);
  const tierFlashStyle = useAnimatedStyle(() => ({
    opacity: tierFlashOpacity.value,
    transform: [{ scale: tierFlashScale.value }],
  }));

  useEffect(() => {
    prevTierRef.current = -1;
  }, [gameSessionId]);

  useEffect(() => {
    if (tier > 0 && tier > prevTierRef.current) {
      const label = getTierLabel(t, tier);
      if (label) {
        setTierLabel(label);
        feedbackNewLevel();
        tierFlashOpacity.value = withSequence(
          withTiming(1, { duration: 180 }),
          withTiming(1, { duration: 900 }),
          withTiming(0, { duration: 350 }),
        );
        tierFlashScale.value = withSequence(
          withTiming(1, { duration: 180 }),
          withTiming(1.04, { duration: 900 }),
          withTiming(0.8, { duration: 350 }),
        );
      }
    }
    prevTierRef.current = tier;
  }, [t, i18n.language, tier]);

  return { tierLabel, tierFlashStyle };
}
