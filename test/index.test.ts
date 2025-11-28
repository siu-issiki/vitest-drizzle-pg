/**
 * vitest-drizzle-environment のテスト
 *
 * setupDrizzleEnvironment は setup.ts でセットアップ済み。
 * client.ts をモックして vitestDrizzle.client を返すことで、
 * 各テストは自動的にトランザクション内で実行され、終了時にロールバックされる。
 */

import { describe, test, expect, vi } from 'vitest';

// client.ts をモックして vitestDrizzle.client を返す
vi.mock('./client', () => ({
  getClient: () => vitestDrizzle.client,
}));

import {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  getUserCount,
  createPost,
  getPostsByUserId,
  getAllPosts,
  createUserWithPosts,
} from './index';

// ============================================================
// テスト間の独立性を確認するテスト
// ============================================================

describe('テスト間の独立性', () => {
  test('テスト1: ユーザーを3人作成', async () => {
    await createUser('ユーザー1', 'user1@example.com');
    await createUser('ユーザー2', 'user2@example.com');
    await createUser('ユーザー3', 'user3@example.com');

    const count = await getUserCount();
    expect(count).toBe(3);
  });

  test('テスト2: 前のテストのデータは存在しない（独立性確認）', async () => {
    // テスト1で作成した3人のユーザーはロールバックされているはず
    const count = await getUserCount();
    expect(count).toBe(0);
  });

  test('テスト3: 同じメールアドレスで作成可能（前テストがロールバックされている証拠）', async () => {
    // テスト1と同じメールアドレスで作成できる = 前のテストのデータは消えている
    const user = await createUser('別のユーザー1', 'user1@example.com');
    expect(user.email).toBe('user1@example.com');
  });

  test('テスト4: さらに別のテストでも同じメールアドレスが使える', async () => {
    const user = await createUser('また別のユーザー', 'user1@example.com');
    expect(user.email).toBe('user1@example.com');

    const count = await getUserCount();
    expect(count).toBe(1);
  });
});

// ============================================================
// CRUD操作のテスト
// ============================================================

describe('ユーザーCRUD操作', () => {
  test('ユーザーを作成してIDで取得できる', async () => {
    const created = await createUser('山田太郎', 'yamada@example.com');
    expect(created.id).toBeDefined();
    expect(created.name).toBe('山田太郎');

    const found = await getUserById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('山田太郎');
  });

  test('ユーザーをメールアドレスで取得できる', async () => {
    await createUser('佐藤花子', 'sato@example.com');

    const found = await getUserByEmail('sato@example.com');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('佐藤花子');
  });

  test('存在しないユーザーはnullを返す', async () => {
    const found = await getUserById(99999);
    expect(found).toBeNull();
  });

  test('全ユーザーを取得できる', async () => {
    await createUser('ユーザーA', 'a@example.com');
    await createUser('ユーザーB', 'b@example.com');

    const allUsers = await getAllUsers();
    expect(allUsers).toHaveLength(2);
  });
});

// ============================================================
// リレーション操作のテスト
// ============================================================

describe('投稿とリレーション', () => {
  test('ユーザーの投稿を作成して取得できる', async () => {
    const user = await createUser('ブロガー', 'blogger@example.com');
    await createPost('初めての投稿', '初めまして！', user.id);
    await createPost('2回目の投稿', '続きです', user.id);

    const userPosts = await getPostsByUserId(user.id);
    expect(userPosts).toHaveLength(2);
  });

  test('前のテストの投稿は存在しない', async () => {
    const allPosts = await getAllPosts();
    expect(allPosts).toHaveLength(0);
  });

  test('ユーザーと投稿を同時に作成できる', async () => {
    const { user, posts } = await createUserWithPosts(
      '作家',
      'writer@example.com',
      ['第1章', '第2章', '第3章']
    );

    expect(user.name).toBe('作家');
    expect(posts).toHaveLength(3);

    const foundPosts = await getPostsByUserId(user.id);
    expect(foundPosts).toHaveLength(3);
  });
});

// ============================================================
// 並行テストでの独立性確認
// ============================================================

describe('複数describeブロック間の独立性', () => {
  test('このdescribeでもデータは空', async () => {
    const users = await getAllUsers();
    const posts = await getAllPosts();

    expect(users).toHaveLength(0);
    expect(posts).toHaveLength(0);
  });

  test('大量データを作成してもロールバックされる', async () => {
    // 10人のユーザーを作成
    for (let i = 0; i < 10; i++) {
      const user = await createUser(`ユーザー${i}`, `user${i}@example.com`);
      // 各ユーザーに5件の投稿
      for (let j = 0; j < 5; j++) {
        await createPost(`投稿${i}-${j}`, `内容${i}-${j}`, user.id);
      }
    }

    const userCount = await getUserCount();
    const allPosts = await getAllPosts();

    expect(userCount).toBe(10);
    expect(allPosts).toHaveLength(50);
  });

  test('前の大量データテスト後もデータは空', async () => {
    const users = await getAllUsers();
    const posts = await getAllPosts();

    expect(users).toHaveLength(0);
    expect(posts).toHaveLength(0);
  });
});
