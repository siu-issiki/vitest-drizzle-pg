import type { VitestDrizzleContext } from './types';

/**
 * グローバル変数の型定義
 * テストファイル内でvitestDrizzleを使用するために必要
 */
declare global {
  /**
   * Drizzleテスト環境のグローバルコンテキスト
   * setupDrizzleEnvironment()またはuseDrizzleTransaction()を呼び出した後、
   * 各テストケース内でアクセス可能
   */
  // eslint-disable-next-line no-var
  var vitestDrizzle: VitestDrizzleContext;
}

export {};
