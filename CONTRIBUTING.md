# Contributing

vitest-drizzle-environment へのコントリビューションを歓迎します！

## 開発環境のセットアップ

### 必要なもの

- Node.js 18+
- pnpm
- Docker（PostgreSQLを起動するため）

### セットアップ手順

```bash
# リポジトリをクローン
git clone https://github.com/siu-issiki/vitest-drizzle-environment.git
cd vitest-drizzle-environment

# 依存関係をインストール
pnpm install

# PostgreSQLを起動
docker compose up -d

# ビルド
pnpm build

# テスト用の依存関係をインストール
pnpm test:install

# テストを実行
pnpm test
```

## プルリクエストの作成

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## コーディング規約

- TypeScriptを使用し、strict modeを維持
- ESMモジュール形式を使用
- コードにはJSDocコメントを追加
- テストを書く

## Issue の報告

バグを発見した場合や機能リクエストがある場合は、GitHubのIssueで報告してください。

- バグの場合: 再現手順、期待される動作、実際の動作を記載
- 機能リクエストの場合: ユースケースと提案する解決策を記載

## ライセンス

コントリビューションはMITライセンスの下で提供されます。

