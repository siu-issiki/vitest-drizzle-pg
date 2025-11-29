import { beforeEach, afterEach } from 'vitest';
import { DrizzleEnvironmentContext } from './context';
import type {
  DrizzleEnvironmentOptions,
  TransactionCapableClient,
  VitestDrizzleContext,
} from './types';

/**
 * Set up the Drizzle test environment
 *
 * Call this function within a describe block, at the top level of a test file,
 * or in a Vitest setup file (specified in vitest.config.ts setupFiles).
 * Each test case will automatically run within a transaction that
 * rolls back when the test ends.
 *
 * @example
 * ```ts
 * // setup.ts (specified in vitest.config.ts setupFiles)
 * import { setupDrizzleEnvironment } from "@siu-issiki/vitest-drizzle-pg";
 * import { db } from "./db";
 *
 * setupDrizzleEnvironment({
 *   client: () => db,
 * });
 * ```
 *
 * @example
 * ```ts
 * // Test file
 * test("creates a user", async () => {
 *   await vitestDrizzle.client.insert(users).values({ name: "test" });
 *   const result = await vitestDrizzle.client.select().from(users);
 *   expect(result).toHaveLength(1);
 * }); // Automatically rolls back when test ends
 * ```
 */
export function setupDrizzleEnvironment<
  TDatabase extends TransactionCapableClient<TTransaction>,
  TTransaction
>(options: DrizzleEnvironmentOptions<TDatabase, TTransaction>): void {
  const context = new DrizzleEnvironmentContext<TDatabase, TTransaction>(
    options
  );

  const vitestDrizzleProxy: VitestDrizzleContext<TTransaction> = {
    get client() {
      const tx = context.getCurrentTransaction();
      if (!tx) {
        console.warn(
          'vitestDrizzle.client should be used in test or beforeEach functions because transaction has not yet started.'
        );
      }
      return tx as TTransaction;
    },
  };

  (
    globalThis as unknown as {
      vitestDrizzle: VitestDrizzleContext<TTransaction>;
    }
  ).vitestDrizzle = vitestDrizzleProxy;

  // Initialize DB client at the start of the test suite
  beforeEach(async () => {
    // Initialize context if not already initialized
    if (!context.getDatabase()) {
      await context.setup();
    }

    // Start transaction
    await context.beginTransaction();
  });

  // Rollback after each test
  afterEach(async () => {
    await context.rollbackTransaction();
  });
}
