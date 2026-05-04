import { Redirect } from 'expo-router';
import TraceOverScreen from '@/features/trace/screens/TraceOverScreen';
import { ONLY_CLASSIC_MODE } from '@/game/config/modesAvailability';

export default function TraceOverRoute() {
  if (ONLY_CLASSIC_MODE) {
    return <Redirect href="/" />;
  }
  return <TraceOverScreen />;
}
