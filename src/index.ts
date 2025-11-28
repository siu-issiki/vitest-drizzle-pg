/**
 * vitest-drizzle-environment
 *
 * VitestテストでDrizzle ORM (PostgreSQL) を使用する際に、
 * テストケースごとに自動でトランザクションをロールバックする機能を提供します。
 *
 * jest-prismaにインスパイアされた実装で、各テストを独立したトランザクション内で
 * 実行し、テスト終了時に自動でロールバックします。
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

// 型定義をエクスポート
export type {
  DrizzleEnvironmentOptions,
  TransactionCapableClient,
  VitestDrizzleContext,
} from './types';

// セットアップ関数をエクスポート
export { setupDrizzleEnvironment } from './setup';
