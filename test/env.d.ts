import type { db } from './db';
import type { VitestDrizzleContext } from '@siu-issiki/vitest-drizzle-environment';

// Get the type of the callback argument for db.transaction()
type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

declare global {
  var vitestDrizzle: VitestDrizzleContext<DrizzleTransaction>;
}

export {};
