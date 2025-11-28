/**
 * Drizzle環境のオプション設定
 */
export interface DrizzleEnvironmentOptions<
  TDatabase = unknown,
  TTransaction = unknown
> {
  /**
   * Drizzleインスタンスを提供する関数
   * テストスイートごとに呼び出され、トランザクション管理に使用される
   */
  client: () => TDatabase | Promise<TDatabase>;

  /**
   * 各テストケースの前に実行されるセットアップ関数（オプション）
   */
  setup?: (tx: TTransaction) => void | Promise<void>;

  /**
   * 各テストケースの後に実行されるクリーンアップ関数（オプション）
   * rollback前に呼び出される
   */
  teardown?: (tx: TTransaction) => void | Promise<void>;

  /**
   * データベース接続を終了する関数（オプション）
   * テストスイート終了時に呼び出される
   */
  disconnect?: () => void | Promise<void>;
}

/**
 * トランザクションをサポートするDrizzleクライアントのインターフェース
 */
export interface TransactionCapableClient<TTransaction = unknown> {
  transaction<T>(
    callback: (tx: TTransaction) => Promise<T>,
    config?: unknown
  ): Promise<T>;
}

/**
 * vitestDrizzleグローバル変数の型
 */
export interface VitestDrizzleContext<TTransaction = unknown> {
  /**
   * 現在のテストケースで使用できるトランザクション
   * このトランザクションはテスト終了時に自動でrollbackされる
   */
  client: TTransaction;
}

/**
 * グローバル変数の型定義
 */
declare global {
  // eslint-disable-next-line no-var
  var vitestDrizzle: VitestDrizzleContext<unknown>;
}

/**
 * テスト環境の状態
 */
export interface EnvironmentState<TDatabase = unknown, TTransaction = unknown> {
  db: TDatabase | null;
  currentTransaction: TTransaction | null;
  transactionPromise: Promise<void> | null;
  resolveTransaction: (() => void) | null;
  rollbackError: Error | null;
}

/**
 * Rollback専用のエラー
 * トランザクションを強制的にrollbackするために使用
 */
export class RollbackError extends Error {
  constructor() {
    super('Transaction rollback requested');
    this.name = 'RollbackError';
  }
}
