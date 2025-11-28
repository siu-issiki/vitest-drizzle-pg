import type {
  DrizzleEnvironmentOptions,
  EnvironmentState,
  TransactionCapableClient,
} from './types';
import { RollbackError } from './types';

/**
 * Class that manages the context of the test environment
 *
 * Uses the same Promise pending pattern as jest-prisma:
 * 1. Start a transaction
 * 2. Return a Promise within the transaction and hold the resolve
 * 3. Call reject() to rollback when the test ends
 * 4. Use .catch(() => true) to prevent Unhandled Rejection
 */
export class DrizzleEnvironmentContext<
  TDatabase extends TransactionCapableClient<TTransaction>,
  TTransaction
> {
  private options: DrizzleEnvironmentOptions<TDatabase, TTransaction>;
  private state: EnvironmentState<TDatabase, TTransaction>;

  constructor(options: DrizzleEnvironmentOptions<TDatabase, TTransaction>) {
    this.options = options;
    this.state = {
      db: null,
      currentTransaction: null,
      transactionPromise: null,
      resolveTransaction: null,
      rollbackError: null,
    };
  }

  /**
   * Initialize the environment
   */
  async setup(): Promise<void> {
    this.state.db = (await this.options.client()) as TDatabase;
  }

  /**
   * Clean up the environment
   */
  async teardown(): Promise<void> {
    if (this.options.disconnect) {
      await this.options.disconnect();
    }
    this.state.db = null;
  }

  /**
   * Start a transaction for each test case
   *
   * Promise pending pattern similar to jest-prisma:
   * 1. Call db.transaction()
   * 2. Return a new Promise within the callback
   * 3. Hold the reject of that Promise
   * 4. Call reject() in endTransaction() to rollback
   */
  async beginTransaction(): Promise<TTransaction> {
    if (!this.state.db) {
      throw new Error(
        'Database client is not initialized. Call setup() first.'
      );
    }

    return new Promise<TTransaction>((resolveOuter) => {
      // Start transaction using Promise pending pattern
      this.state.transactionPromise = this.state
        .db!.transaction(async (tx) => {
          this.state.currentTransaction = tx as TTransaction;

          // Execute optional setup function
          if (this.options.setup) {
            await this.options.setup(tx as TTransaction);
          }

          // Pass transaction to outer scope (return control to test code)
          resolveOuter(tx as TTransaction);

          // Keep Promise pending until endTransaction() is called
          // When reject is called, the transaction will be rolled back
          return new Promise<void>((_, reject) => {
            this.state.resolveTransaction = () => reject(new RollbackError());
          });
        })
        .catch(() => {
          // Same as jest-prisma: use .catch(() => true) to prevent Unhandled Rejection
          // Swallow all errors including RollbackError here
        }) as Promise<void>;
    });
  }

  /**
   * Rollback the transaction
   */
  async rollbackTransaction(): Promise<void> {
    // Execute optional teardown function
    if (this.options.teardown && this.state.currentTransaction) {
      try {
        await this.options.teardown(this.state.currentTransaction);
      } catch (error) {
        console.error('Error in teardown function:', error);
      }
    }

    // End transaction (trigger rollback)
    if (this.state.resolveTransaction) {
      this.state.resolveTransaction();
      this.state.resolveTransaction = null;
    }

    // Wait for transaction Promise to complete
    if (this.state.transactionPromise) {
      try {
        await this.state.transactionPromise;
      } catch {
        // Ignore errors (already handled by .catch(() => true))
      }
      this.state.transactionPromise = null;
    }

    this.state.currentTransaction = null;
  }

  /**
   * Get the current transaction
   */
  getCurrentTransaction(): TTransaction | null {
    return this.state.currentTransaction;
  }

  /**
   * Get the database client
   */
  getDatabase(): TDatabase | null {
    return this.state.db;
  }
}
