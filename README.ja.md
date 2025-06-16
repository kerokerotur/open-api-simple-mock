# open-api-nice-mock

OpenAPI仕様からTypeScriptモデルとモックサーバーを生成するCLIツール。

[![CI](https://github.com/yourusername/open-api-nice-mock/workflows/CI/badge.svg)](https://github.com/yourusername/open-api-nice-mock/actions)
[![npm version](https://badge.fury.io/js/open-api-nice-mock.svg)](https://badge.fury.io/js/open-api-nice-mock)
[![codecov](https://codecov.io/gh/yourusername/open-api-nice-mock/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/open-api-nice-mock)

## 特徴

- 🚀 **TypeScriptモデル生成** - openapi-generatorを使用してOpenAPI仕様からモデル生成
- 🖥️ **モックサーバー** - OpenAPIの例に基づく自動レスポンス生成
- 📁 **URL構造ベースのディレクトリ** - モックレスポンスのカスタマイズが簡単
- 🔧 **柔軟な設定** - openapi-generatorの全オプションをサポート
- 🧪 **完全なテストカバレッジ** - 80%以上のカバレッジを維持
- 📦 **使いやすい** CLIインターフェース

## インストール

```bash
npm install -g open-api-nice-mock
```

## クイックスタート

### 1. OpenAPI仕様からモックサーバーを生成

```bash
open-api-nice-mock generate your-openapi-spec.json
```

これにより以下が実行されます：
- openapi-generatorを使用したTypeScriptモデルの生成
- URL構造に基づくモックレスポンスファイルの作成
- 出力ディレクトリにOpenAPI仕様をコピー

### 2. モックサーバーを起動

```bash
open-api-nice-mock run
```

モックサーバーが `http://localhost:3000` で起動し、OpenAPI仕様に基づいてレスポンスを提供します。

## 使用方法

### generateコマンド

```bash
open-api-nice-mock generate <spec> [options]
```

**引数:**
- `<spec>` - OpenAPI仕様ファイルのパスまたはURL

**オプション:**
- `-o, --output <dir>` - 出力ディレクトリ（デフォルト: `./generated`）
- `-g, --generator-name <name>` - ジェネレーター名（デフォルト: `typescript-node`）
- `--additional-properties <props>` - ジェネレーターの追加プロパティ
- `--global-property <props>` - ジェネレーターのグローバルプロパティ
- `--config <file>` - ジェネレーターの設定ファイル
- `--template-dir <dir>` - テンプレートディレクトリ
- `--auth <auth>` - 仕様取得用の認証ヘッダー
- `--skip-validate-spec` - 入力仕様の検証をスキップ
- `--strict-spec` - 仕様を厳密に処理

**例:**

```bash
# 基本的な使用法
open-api-nice-mock generate ./api/openapi.yaml

# カスタム出力ディレクトリを使用
open-api-nice-mock generate ./api/openapi.yaml -o ./my-mocks

# URLから追加プロパティと共に生成
open-api-nice-mock generate https://petstore.swagger.io/v2/swagger.json --additional-properties="npmName=my-client"

# 設定ファイルを使用
open-api-nice-mock generate ./api/openapi.yaml --config ./openapi-config.json
```

### runコマンド

```bash
open-api-nice-mock run [options]
```

**オプション:**
- `-p, --port <port>` - サーバーのポート番号（デフォルト: `3000`）
- `-d, --dir <dir>` - 生成ファイルのディレクトリ（デフォルト: `./generated`）
- `-h, --host <host>` - バインドするホスト（デフォルト: `localhost`）

**例:**

```bash
# デフォルトポート3000で起動
open-api-nice-mock run

# カスタムポートで起動
open-api-nice-mock run -p 8080

# カスタム生成ディレクトリを使用
open-api-nice-mock run -d ./my-generated-files -p 3001
```

## モックレスポンスのカスタマイズ

生成されたモックサーバーは、簡単にカスタマイズできるようAPI URLに基づいたディレクトリ構造を作成します：

```
generated/
├── mocks/
│   ├── users/
│   │   ├── get.json          # GET /users
│   │   └── post.json         # POST /users
│   ├── users/
│   │   └── _id/
│   │       ├── get.json      # GET /users/{id}
│   │       └── put.json      # PUT /users/{id}
│   └── users/
│       └── _id/
│           └── posts/
│               └── get.json  # GET /users/{id}/posts
├── openapi.json              # OpenAPI仕様
└── mock-config.json          # サーバー設定
```

### モックレスポンスのカスタマイズ

各モックレスポンスファイルには、異なるHTTPステータスコードのレスポンスが含まれます：

```json
{
  "200": {
    "id": 1,
    "name": "田中太郎",
    "email": "tanaka@example.com"
  },
  "404": {
    "error": "ユーザーが見つかりません"
  }
}
```

サーバーは、OpenAPI仕様とカスタムモックファイルに基づいて適切なレスポンスを自動的に提供します。

## レスポンス生成戦略

1. **カスタムモックファイル** - カスタムモックファイルが存在する場合、それが使用されます
2. **OpenAPIの例** - OpenAPI仕様で例が定義されている場合、それが使用されます
3. **スキーマから生成** - スキーマ定義に基づいてデフォルト値が生成されます

## 開発

### 要件

- Node.js >= 16.0.0
- npm または yarn

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/open-api-nice-mock.git
cd open-api-nice-mock

# 依存関係をインストール
npm install

# プロジェクトをビルド
npm run build

# テストを実行
npm test

# カバレッジ付きでテストを実行
npm run test:coverage

# リンターを実行
npm run lint
```

### テスト

このプロジェクトは80%以上のテストカバレッジを維持しています。テストスイートを実行：

```bash
# 全テストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

## 貢献

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更を加える
4. 変更に対するテストを追加
5. テストが通り、カバレッジが80%以上を維持していることを確認
6. 変更をコミット（`git commit -m 'Add some amazing feature'`）
7. ブランチにプッシュ（`git push origin feature/amazing-feature`）
8. プルリクエストを作成

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 変更履歴

変更のリストについては[CHANGELOG.md](CHANGELOG.md)を参照してください。