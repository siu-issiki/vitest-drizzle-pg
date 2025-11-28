import type { VitestDrizzleContext } from './types';

/**
 * Global variable type definitions
 * Required to use vitestDrizzle in test files
 */
declare global {
  /**
   * Global context for the Drizzle test environment
   * Accessible within each test case after calling
   * setupDrizzleEnvironment() or useDrizzleTransaction()
   */
  // eslint-disable-next-line no-var
  var vitestDrizzle: VitestDrizzleContext;
}

export {};
