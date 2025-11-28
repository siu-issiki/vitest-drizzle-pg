/**
 * Vitest セットアップファイル
 *
 * このファイルで setupDrizzleEnvironment を呼び出すことで、
 * 全てのテストファイルで自動的にトランザクション管理が有効になります。
 */

import { beforeAll, afterAll } from 'vitest';
import { setupDrizzleEnvironment } from 'vitest-drizzle-environment';
import { db, initDb, dropTables, closeDb } from './db';

// テスト前後のセットアップ
beforeAll(async () => {
  await dropTables();
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

// Drizzle環境をセットアップ
// これにより、全テストがトランザクション内で実行され、終了時に自動ロールバックされる
setupDrizzleEnvironment({
  client: () => db,
});
