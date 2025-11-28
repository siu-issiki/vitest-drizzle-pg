# vitest-drizzle-environment

Vitestテスト環境でDrizzle ORM (PostgreSQL) を使用する際に、**テストケースごとに自動でトランザクションをロールバック**する機能を提供します。

[jest-prisma](https://github.com/Quramy/jest-prisma)にインスパイアされた実装で、各テストを独立したトランザクション内で実行し、テスト終了時に自動でロールバックすることで、テスト間のデータ分離を実現します。

## 特徴

- 🔄 **自動ロールバック**: 各テストケース終了時にトランザクションが自動でロールバックされる
- 🧪 **テスト分離**: テスト間でデータベースの状態が共有されない
- 🚀 **高速**: 実際のDB操作を行いながら、ロールバックにより高速なテスト実行
- 🐘 **PostgreSQL特化**: node-postgresとの最適な統合

## インストール

```bash
npm install -D vitest-drizzle-environment
# または
pnpm add -D vitest-drizzle-environment
# または
yarn add -D vitest-drizzle-environment
```

## クイックスタート

### 1. Docker でPostgreSQLを起動

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
```

```bash
docker compose up -d
```

### 2. Drizzle ORMのセットアップ

```typescript
// db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'test',
  password: 'test',
  database: 'test',
});

export const db = drizzle(pool, { schema });
```

### 3. Vitestセットアップファイルを作成

```typescript
// setup.ts
import { beforeAll, afterAll } from 'vitest';
import { setupDrizzleEnvironment } from 'vitest-drizzle-environment';
import { db } from './db';

// テスト前後のセットアップ
beforeAll(async () => {
  // テーブル作成など
});

afterAll(async () => {
  // DB接続のクローズなど
});

// Drizzle環境をセットアップ
setupDrizzleEnvironment({
  client: () => db,
});
```

### 4. Vitest設定でセットアップファイルを指定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./setup.ts'],
    // テストを順次実行（DBの整合性を保つため）
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
```

### 5. テストを書く

```typescript
// users.test.ts
import { describe, test, expect } from 'vitest';
import { users } from './schema';

test('ユーザーを作成できる', async () => {
  // vitestDrizzle.client はトランザクション内のクライアント
  await vitestDrizzle.client.insert(users).values({
    name: 'テストユーザー',
    email: 'test@example.com',
  });

  const result = await vitestDrizzle.client.select().from(users);
  expect(result).toHaveLength(1);
}); // ← テスト終了時に自動でロールバック

test('前のテストのデータは存在しない', async () => {
  const result = await vitestDrizzle.client.select().from(users);
  expect(result).toHaveLength(0); // ロールバックされている！
});
```

## ビジネスロジックとの統合

テストファイルで `vitestDrizzle.client` を直接使う代わりに、ビジネスロジック側でDBクライアントを抽象化し、テストでモックすることを推奨します。

### 1. クライアントモジュールを作成

```typescript
// client.ts
import { db } from './db';

export function getClient() {
  return db;
}
```

### 2. ビジネスロジックでクライアントモジュールを使用

```typescript
// users.ts
import { getClient } from './client';
import { users } from './schema';

export async function createUser(name: string, email: string) {
  const [user] = await getClient()
    .insert(users)
    .values({ name, email })
    .returning();
  return user;
}

export async function getAllUsers() {
  return getClient().select().from(users);
}
```

### 3. テストでクライアントモジュールをモック

```typescript
// users.test.ts
import { describe, test, expect, vi } from 'vitest';

// client.ts をモックして vitestDrizzle.client を返す
vi.mock('./client', () => ({
  getClient: () => vitestDrizzle.client,
}));

import { createUser, getAllUsers } from './users';

test('ユーザーを作成できる', async () => {
  const user = await createUser('テストユーザー', 'test@example.com');
  expect(user.name).toBe('テストユーザー');
});

test('前のテストのデータは存在しない', async () => {
  const users = await getAllUsers();
  expect(users).toHaveLength(0);
});
```

## API

### `setupDrizzleEnvironment(options)`

Vitestのセットアップファイルで呼び出し、各テストを自動的にトランザクション内で実行します。

```typescript
setupDrizzleEnvironment({
  // 必須: Drizzleインスタンスを返す関数
  client: () => db,
  
  // オプション: 各テストの前に実行されるセットアップ関数
  setup: async (tx) => {
    // 初期データの投入など（トランザクション内で実行）
    await tx.insert(users).values({ name: 'Admin', email: 'admin@example.com' });
  },
  
  // オプション: 各テストの後（ロールバック前）に実行されるクリーンアップ関数
  teardown: async (tx) => {
    // クリーンアップ処理
  },
  
  // オプション: テストスイート終了時にDB接続を閉じる関数
  disconnect: async () => {
    await pool.end();
  },
});
```

## 型安全性

TypeScriptを使用している場合、グローバル型定義を追加することで`vitestDrizzle.client`の型推論を有効にできます。

```typescript
// env.d.ts
import type { db } from './db';
import type { VitestDrizzleContext } from 'vitest-drizzle-environment';

type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

declare global {
  var vitestDrizzle: VitestDrizzleContext<DrizzleTransaction>;
}

export {};
```

## 動作原理

jest-prismaと同様の**Promise保留パターン**を使用しています:

1. 各テストケースの開始時に`db.transaction()`でトランザクションを開始
2. トランザクション内で新しいPromiseを作成し、`reject`関数を保持
3. テストコードにトランザクションクライアントを渡す
4. テスト終了時に`reject()`を呼び出してロールバックをトリガー
5. `.catch(() => {})` でUnhandled Rejectionを防ぐ

```typescript
// 内部実装のイメージ
async beginTransaction() {
  return new Promise((resolveOuter) => {
    db.transaction(async (tx) => {
      // テストコードに制御を戻す
      resolveOuter(tx);
      
      // テスト終了まで待機
      return new Promise((_, reject) => {
        this.triggerRollback = () => reject(new RollbackError());
      });
    }).catch(() => {}); // ロールバックエラーを握りつぶす
  });
}
```

## 開発

```bash
# PostgreSQLを起動
docker compose up -d

# 依存関係をインストール
pnpm install

# ビルド
pnpm build

# テスト用の依存関係をインストール（ローカルパッケージとしてインストール）
pnpm test:install

# テスト実行
pnpm test

# ウォッチモードでテスト
pnpm test:watch
```

### プロジェクト構成

```
vitest-drizzle-environment/
├── src/                    # ライブラリのソースコード
├── dist/                   # ビルド成果物
├── test/                   # テスト（独立したパッケージ）
│   ├── package.json        # file:.. でローカルパッケージをインストール
│   └── *.test.ts
├── docker-compose.yml
└── package.json
```

`test/` ディレクトリは独立した `package.json` を持ち、`vitest-drizzle-environment` を `file:..` でローカルパッケージとしてインストールしています。これにより、実際のパッケージ利用者と同じ体験でテストできます。

## ライセンス

MIT
