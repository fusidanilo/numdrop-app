import { consoleTransport, logger } from 'react-native-logs';

/**
 * Same stack as weave-social-app: `react-native-logs` + `consoleTransport` + scoped `extend()`.
 * In production keeps `info`+ so Play Games lines stay visible without full debug noise.
 */
export const log = logger.createLogger({
  severity: __DEV__ ? 'debug' : 'info',
  transport: consoleTransport,
  transportOptions: {
    colors: {
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
      debug: 'grey',
      success: 'greenBright',
    },
  },
  async: false,
  printDate: true,
  printLevel: true,
});

export function getComponentLogger(componentName: string) {
  return log.extend(componentName.toUpperCase());
}
