import { useMemo } from 'react';

import { getComponentLogger } from '@/utils/logging/logger';

/**
 * Logger scoped to a screen/hook name (weave-style `useComponentLogger`).
 */
export function useComponentLogger(componentName: string) {
  return useMemo(() => getComponentLogger(componentName), [componentName]);
}
