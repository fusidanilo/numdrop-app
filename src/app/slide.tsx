import { Redirect } from 'expo-router';
import SlideScreen from '@/features/slide/screens/SlideScreen';
import { ONLY_CLASSIC_MODE } from '@/game/config/modesAvailability';

export default function SlideRoute() {
  if (ONLY_CLASSIC_MODE) {
    return <Redirect href="/" />;
  }
  return <SlideScreen />;
}
