import type {
  DrizzleEnvironmentOptions,
  EnvironmentState,
  TransactionCapableClient,
} from './types';
import { RollbackError } from './types';

/**
 * テスト環境のコンテキストを管理するクラス
 *
 * jest-prismaと同様のPromise保留パターンを使用:
 * 1. トランザクションを開始
 * 2. トランザクション内でPromiseを返し、resolveを保持
 * 3. テスト終了時にreject()を呼び出してロールバック
 * 4. .catch(() => true) でUnhandled Rejectionを防ぐ
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
   * 環境を初期化する
   */
  async setup(): Promise<void> {
    this.state.db = (await this.options.client()) as TDatabase;
  }

  /**
   * 環境をクリーンアップする
   */
  async teardown(): Promise<void> {
    if (this.options.disconnect) {
      await this.options.disconnect();
    }
    this.state.db = null;
  }

  /**
   * テストケースごとにトランザクションを開始する
   *
   * jest-prismaと同様のPromise保留パターン:
   * 1. db.transaction() を呼び出し
   * 2. コールバック内で新しいPromiseを返す
   * 3. そのPromiseのrejectを保持
   * 4. endTransaction()でreject()を呼び出してロールバック
   */
  async beginTransaction(): Promise<TTransaction> {
    if (!this.state.db) {
      throw new Error(
        'Database client is not initialized. Call setup() first.'
      );
    }

    return new Promise<TTransaction>((resolveOuter) => {
      // トランザクションを開始し、Promise保留パターンを使用
      this.state.transactionPromise = this.state
        .db!.transaction(async (tx) => {
          this.state.currentTransaction = tx as TTransaction;

          // オプションのセットアップ関数を実行
          if (this.options.setup) {
            await this.options.setup(tx as TTransaction);
          }

          // 外部にトランザクションを渡す（テストコードに制御を戻す）
          resolveOuter(tx as TTransaction);

          // endTransaction()が呼ばれるまでPromiseを保留
          // rejectが呼ばれるとトランザクションはロールバックされる
          return new Promise<void>((_, reject) => {
            this.state.resolveTransaction = () => reject(new RollbackError());
          });
        })
        .catch(() => {
          // jest-prismaと同様: .catch(() => true) でUnhandled Rejectionを防ぐ
          // RollbackErrorを含む全てのエラーをここで握りつぶす
        }) as Promise<void>;
    });
  }

  /**
   * トランザクションをロールバックする
   */
  async rollbackTransaction(): Promise<void> {
    // オプションのテアダウン関数を実行
    if (this.options.teardown && this.state.currentTransaction) {
      try {
        await this.options.teardown(this.state.currentTransaction);
      } catch (error) {
        console.error('Error in teardown function:', error);
      }
    }

    // トランザクションを終了（ロールバックをトリガー）
    if (this.state.resolveTransaction) {
      this.state.resolveTransaction();
      this.state.resolveTransaction = null;
    }

    // トランザクションPromiseの完了を待つ
    if (this.state.transactionPromise) {
      try {
        await this.state.transactionPromise;
      } catch {
        // エラーは無視（既に.catch(() => true)で処理済み）
      }
      this.state.transactionPromise = null;
    }

    this.state.currentTransaction = null;
  }

  /**
   * 現在のトランザクションを取得
   */
  getCurrentTransaction(): TTransaction | null {
    return this.state.currentTransaction;
  }

  /**
   * データベースクライアントを取得
   */
  getDatabase(): TDatabase | null {
    return this.state.db;
  }
}
