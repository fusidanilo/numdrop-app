import { Redirect } from 'expo-router';
import TraceScreen from '@/features/trace/screens/TraceScreen';
import { ONLY_CLASSIC_MODE } from '@/game/config/modesAvailability';

export default function TraceRoute() {
  if (ONLY_CLASSIC_MODE) {
    return <Redirect href="/" />;
  }
  return <TraceScreen />;
}
