import { Redirect } from 'expo-router';
import MazeOverScreen from '@/features/maze/screens/MazeOverScreen';
import { ONLY_CLASSIC_MODE } from '@/game/config/modesAvailability';

export default function MazeOverRoute() {
  if (ONLY_CLASSIC_MODE) {
    return <Redirect href="/" />;
  }
  return <MazeOverScreen />;
}
