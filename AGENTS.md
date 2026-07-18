# AGENTS.md

このリポジトリで作業するコーディングエージェント向けのガイドです。実在するコマンド・構成のみを記載しています。

## プロジェクト概要

マインスイーパーゲームと MCP（Model Context Protocol）サーバーを統合した Web アプリケーション。npm workspaces を用いた 3 パッケージ構成のモノレポです。

- `packages/shared` — ゲームロジックと型定義（`GameEngine`, `types`, `constants`）。他 2 パッケージから利用される。
- `packages/mcp-server` — Express + MCP サーバー。デフォルトポート 4000。
- `packages/frontend` — React + Vite フロントエンド。ポート 3001。自前のゲームロジックは持たず、`McpClient` 経由で MCP サーバーを操作する。

## エントリポイント

- MCP サーバー: `packages/mcp-server/src/index.ts` → `startServer()`（`packages/mcp-server/src/server.ts`）
- フロントエンド: `packages/frontend/src/main.tsx` → `App.tsx`
- 共通パッケージのエクスポート: `packages/shared/src/index.ts`

MCP のツール定義は `packages/mcp-server/src/tools/`（`reveal_cell`, `flag_cell`, `new_game`, `reset_game`, `get_board`）、リソースは `packages/mcp-server/src/resources/`（`board://current`, `game://info`）にあり、`server.ts` の `createMcpServer()` で登録される。ツールやリソースを追加する際は、該当ディレクトリに定義を追加し、`server.ts` の登録も更新すること。

## セットアップ

```bash
npm install   # ルートで実行（workspaces が全パッケージを解決）
```

- Node.js >= 18.0.0 が必要（ルート `package.json` の `engines`）。
- `packages/frontend/vite.config.ts` は `@minesweeper-mcp/shared` / `@minesweeper-mcp/mcp-server` を各パッケージの `src` にエイリアスするため、フロントエンド開発では `shared` の事前ビルドは不要。

## ビルド / 実行

全コマンドはリポジトリのルートで実行する。

| 目的 | コマンド |
|------|----------|
| 開発（サーバー + フロント同時起動） | `npm run dev` |
| MCP サーバーのみ（tsx） | `npm run dev:mcp` |
| フロントエンドのみ（Vite） | `npm run dev:frontend` |
| 全ビルド | `npm run build` |
| shared のビルド | `npm run build:shared` |
| mcp-server のビルド | `npm run build:mcp-server` |
| frontend のビルド | `npm run build:frontend` |

`npm run build` は `shared → mcp-server → frontend` の順で実行される。`shared` を変更したら、それに依存するパッケージのビルドが影響を受ける点に注意。

## テスト / lint / typecheck

- **専用のテスト・lint・フォーマッタは未設定**（`test`/`lint`/`format` スクリプトや ESLint・Prettier・Vitest 等の設定ファイルは存在しない）。存在しないコマンドを実行・記載しないこと。
- **型チェックはビルドで行う**。`shared` と `mcp-server` は `tsc` でコンパイルされ、`frontend` の `build` は `tsc && vite build`。変更後の検証は `npm run build`（または該当パッケージの `build:*`）で行う。
- 各 `tsconfig.json` は `strict: true`。フロントエンドはさらに `noUnusedLocals` / `noUnusedParameters` / `noFallthroughCasesInSwitch` 等が有効なので、未使用の変数・引数を残さないこと。

## コーディング規約

- **言語**: TypeScript 5.7。すべての本番コードは TS で書く。
- **モジュール形式**: `shared` と `mcp-server` は CommonJS（`tsconfig` の `module: commonjs`）、`frontend` は ESM（`type: module`, `module: ESNext`）。
- **共有ロジックは `shared` に集約**する。フロントエンド／サーバーで重複するゲームロジックや型を作らず、`@minesweeper-mcp/shared` から import する。
- **コメント・識別子**: 既存コードはセクション区切りコメントや JSDoc を日本語で記述しているため、周囲のスタイルに合わせる。
- **zod**: MCP ツールの入力スキーマは `import * as z from 'zod/v4'` を使用（既存ツールに合わせる）。
- パッケージ間参照は `file:../shared` によるワークスペース依存。相対パスでの直接 import は避ける。

## 注意点

- フロントエンドは MCP サーバー（ポート 4000）に依存する。UI を動作確認するときは `npm run dev` で両方を起動する。Vite は `/mcp` と `/health` を 4000 番へプロキシする。
- MCP サーバーのポートは環境変数 `MCP_PORT` で変更可能（未指定時は 4000）。フロントエンドの接続先は `packages/frontend/src/config.ts` にハードコードされているため、ポートを変える場合は両方を合わせること。
- セッションは最終アクセスから 30 分でクリーンアップされる（`SessionManager`）。ゲーム状態はサーバーのメモリ上にのみ保持され、永続化されない。
- 観戦モードは URL クエリ `?sessionId=<ID>` で有効化され、`/game/:sessionId` をポーリングする。
- 難易度は `beginner` / `intermediate` / `advanced` の 3 種で、盤面設定は `packages/shared/src/constants.ts` の `DIFFICULTY_CONFIGS` が唯一の定義。ハードコードで盤面サイズを持たないこと。
- `dist/` はビルド成果物で `.gitignore` 済み。手で編集しない。
- 変更は必要なファイルに限定し、無関係なリファクタリングは避ける。
