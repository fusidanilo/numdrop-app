import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function useGameOverEntryAnimations() {
  const titleScale = useSharedValue(0.6);
  const titleOpacity = useSharedValue(0);
  const scoreOpacity = useSharedValue(0);
  const btnsOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 14, stiffness: 160 });
    titleOpacity.value = withTiming(1, { duration: 300 });
    scoreOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
    btnsOpacity.value = withDelay(400, withTiming(1, { duration: 350 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));
  const scoreStyle = useAnimatedStyle(() => ({ opacity: scoreOpacity.value }));
  const btnsStyle = useAnimatedStyle(() => ({ opacity: btnsOpacity.value }));

  return { titleStyle, scoreStyle, btnsStyle };
}
