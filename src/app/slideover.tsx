import { Redirect } from 'expo-router';
import SlideOverScreen from '@/features/slide/screens/SlideOverScreen';
import { ONLY_CLASSIC_MODE } from '@/game/config/modesAvailability';

export default function SlideOverRoute() {
  if (ONLY_CLASSIC_MODE) {
    return <Redirect href="/" />;
  }
  return <SlideOverScreen />;
}
