/**
 * DBクライアントを提供するモジュール
 *
 * テスト時はこのモジュールをモックして vitestDrizzle.client を返す
 */

import { db } from './db';

export function getClient() {
  return db;
}
