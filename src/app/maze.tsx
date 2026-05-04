import { Redirect } from 'expo-router';
import MazeScreen from '@/features/maze/screens/MazeScreen';
import { ONLY_CLASSIC_MODE } from '@/game/config/modesAvailability';

export default function MazeRoute() {
  if (ONLY_CLASSIC_MODE) {
    return <Redirect href="/" />;
  }
  return <MazeScreen />;
}
