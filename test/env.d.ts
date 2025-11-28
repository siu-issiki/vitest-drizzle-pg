import type { db } from './db';
import type { VitestDrizzleContext } from 'vitest-drizzle-environment';

// db.transaction() のコールバック引数の型を取得
type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

declare global {
  var vitestDrizzle: VitestDrizzleContext<DrizzleTransaction>;
}

export {};
