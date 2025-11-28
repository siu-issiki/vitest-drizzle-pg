import { beforeEach, afterEach } from 'vitest';
import { DrizzleEnvironmentContext } from './context';
import type {
  DrizzleEnvironmentOptions,
  TransactionCapableClient,
  VitestDrizzleContext,
} from './types';

/**
 * vitestDrizzleグローバル変数を設定
 */
function setGlobalVitestDrizzle<TTransaction>(
  client: TTransaction | null
): void {
  (
    globalThis as unknown as {
      vitestDrizzle: VitestDrizzleContext<TTransaction>;
    }
  ).vitestDrizzle = {
    client: client as TTransaction,
  };
}

/**
 * Drizzleテスト環境をセットアップする
 *
 * この関数をdescribeブロック内、テストファイルのトップレベル、
 * またはVitestのセットアップファイル（vitest.config.tsのsetupFiles）で呼び出すと、
 * 各テストケースが自動的にトランザクション内で実行され、
 * テスト終了時にロールバックされる。
 *
 * @example
 * ```ts
 * // setup.ts (vitest.config.tsのsetupFilesで指定)
 * import { setupDrizzleEnvironment } from "vitest-drizzle-environment";
 * import { db } from "./db";
 *
 * setupDrizzleEnvironment({
 *   client: () => db,
 * });
 * ```
 *
 * @example
 * ```ts
 * // テストファイル
 * test("creates a user", async () => {
 *   await vitestDrizzle.client.insert(users).values({ name: "test" });
 *   const result = await vitestDrizzle.client.select().from(users);
 *   expect(result).toHaveLength(1);
 * }); // テスト終了時に自動でロールバック
 * ```
 */
export function setupDrizzleEnvironment<
  TDatabase extends TransactionCapableClient<TTransaction>,
  TTransaction
>(options: DrizzleEnvironmentOptions<TDatabase, TTransaction>): void {
  const context = new DrizzleEnvironmentContext<TDatabase, TTransaction>(
    options
  );

  // テストスイートの最初にDBクライアントを初期化
  beforeEach(async () => {
    // コンテキストが初期化されていなければ初期化
    if (!context.getDatabase()) {
      await context.setup();
    }

    // トランザクションを開始
    const tx = await context.beginTransaction();
    setGlobalVitestDrizzle(tx);
  });

  // 各テスト終了時にロールバック
  afterEach(async () => {
    await context.rollbackTransaction();
    setGlobalVitestDrizzle(null);
  });
}
