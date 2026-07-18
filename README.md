# Minesweeper MCP

マインスイーパーゲームと MCP（Model Context Protocol）サーバーを統合した Web アプリケーション。ブラウザから通常プレイできるほか、MCP クライアント（LLM 等）からゲームを操作したり、進行中のゲームを別のブラウザから観戦できます。

## 主な機能

- **通常プレイ**: React + TypeScript のフロントエンドでマインスイーパーをプレイ（Windows 95 風のレトロ UI）
- **MCP 連携**: 外部 MCP クライアントから MCP ツール／リソースでゲームを操作
- **観戦モード**: `?sessionId=<セッションID>` 付きで開くと、進行中のゲーム盤面をポーリングで表示
- **難易度設定**: 初級・中級・上級の 3 段階
- **サーバー稼働監視**: フロントエンドがヘルスチェックエンドポイントをポーリングして接続状態を表示

## アーキテクチャ

フロントエンドは自前でゲームロジックを持たず、`McpClient` を介して MCP サーバーへ接続し、サーバー側の `GameEngine` を操作します。ゲームロジックと型定義は `shared` パッケージに集約され、フロントエンドと MCP サーバーの両方から利用されます。

```
minesweeper_mcp/
├── packages/
│   ├── shared/          # 共通ゲームロジック・型定義（GameEngine, 型, 定数）
│   ├── mcp-server/      # Express + MCP サーバー（デフォルトポート 4000）
│   └── frontend/        # React + Vite フロントエンド（ポート 3001）
├── package.json         # npm workspaces のルート
├── opencode.json        # opencode 用 MCP 設定
└── README.md
```

## 難易度

| 難易度 | 行数 | 列数 | 地雷数 | 内部キー |
|--------|------|------|--------|----------|
| 初級 | 9 | 9 | 10 | `beginner` |
| 中級 | 16 | 16 | 40 | `intermediate` |
| 上級 | 16 | 30 | 99 | `advanced` |

いずれの難易度も通常プレイ・MCP の両方で利用できます。MCP の `new_game` は難易度を省略すると `advanced`（上級）で開始します。

## セットアップ

### 前提条件

- Node.js >= 18.0.0（`package.json` の `engines` で指定）
- npm（npm workspaces を利用）

### インストール

```bash
# ルートで一括インストール（workspaces）
npm install
```

### 実行

#### 全てのサービスを起動

```bash
npm run dev
```

`concurrently` により MCP サーバーとフロントエンドが同時に起動します。

#### MCP サーバーのみ起動

```bash
npm run dev:mcp
```

MCP サーバーが `http://localhost:4000/mcp` で待ち受けます。ポートは環境変数 `MCP_PORT` で変更できます。

#### フロントエンドのみ起動

```bash
npm run dev:frontend
```

ブラウザで `http://localhost:3001` にアクセスしてプレイできます。Vite の開発サーバーは `/mcp` と `/health` を `http://localhost:4000` へプロキシします。

## ビルド

```bash
# 全パッケージをビルド（shared → mcp-server → frontend の順）
npm run build

# 個別にビルド
npm run build:shared      # 共通パッケージ（tsc）
npm run build:mcp-server  # MCP サーバー（tsc）
npm run build:frontend    # フロントエンド（tsc && vite build）
```

ビルド済みの MCP サーバーは各パッケージ内で `npm start`（`node dist/index.js`）から起動できます。

## MCP ツール

MCP サーバーは以下のツールを提供します。座標はいずれも 0 始まり（`row` は上端が 0、`col` は左端が 0）。

### `reveal_cell`
指定した位置のセルを開きます。

**入力:** `{ "row": 0, "col": 0 }`

**出力（`content[0].text` に JSON 文字列）:**
```json
{
  "revealed": true,
  "isMine": false,
  "neighborMines": 0,
  "gameStatus": "playing"
}
```

### `flag_cell`
指定した位置のセルにフラグを立てる／外します。

**入力:** `{ "row": 0, "col": 0 }`

**出力:**
```json
{
  "flagged": true,
  "flaggedCount": 1
}
```

### `new_game`
新しいゲームを開始します。`difficulty` を省略すると上級（`advanced`）で開始します。

**入力:** `{ "difficulty": "beginner" }`（省略可、`beginner` / `intermediate` / `advanced`）

**出力（テキスト）:**
```
Started new game (Advanced: 16×30, 99 mines)
Game ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### `reset_game`
現在のゲームを同じ難易度でリセットします。

**入力:** `{}`

**出力（テキスト）:**
```
Game reset. Game ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### `get_board`
現在の盤面を分析ヒント付き JSON で取得します（AI での攻略支援向け）。

**入力:** `{}`

**出力（`content[0].text` に整形済み JSON）:**
```json
{
  "gameInfo": {
    "difficulty": "advanced",
    "rows": 16,
    "cols": 30,
    "totalMines": 99,
    "flagsPlaced": 0,
    "status": "playing"
  },
  "hiddenCells": [{ "row": 0, "col": 0 }],
  "flaggedCells": [],
  "revealedCells": [{ "row": 1, "col": 1, "neighborMines": 2 }],
  "analysisHints": [
    {
      "cell": { "row": 1, "col": 1, "neighborMines": 2 },
      "adjacentHidden": [{ "row": 0, "col": 0 }],
      "adjacentFlagged": 1,
      "remainingMines": 1
    }
  ]
}
```

`analysisHints` は数字セルごとに隣接する未公開セルと残り地雷数（`neighborMines - adjacentFlagged`）を示します。`remainingMines` が 0 なら隣接する未公開セルは安全、`adjacentHidden.length === remainingMines` なら全て地雷です。

## MCP リソース

### `board://current`
現在のゲーム盤面の完全な状態（全セルの配列を含む `GameState`）を JSON で返します。

### `game://info`
現在のゲームのサマリー（`id`, `difficulty`, `rows`, `cols`, `mines`, `status`）を JSON で返します。

## REST エンドポイント

MCP サーバーは MCP 以外に、フロントエンドや観戦モード向けの HTTP エンドポイントも提供します。

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/mcp` | MCP リクエスト（Streamable HTTP トランスポート） |
| GET | `/mcp` | MCP の SSE ストリーム（要 `Mcp-Session-Id`） |
| DELETE | `/mcp` | セッション終了（要 `Mcp-Session-Id`） |
| GET | `/health` | ヘルスチェック（`{ status, activeSessions }`） |
| GET | `/sessions` | アクティブなセッション ID 一覧 |
| GET | `/game/:sessionId` | 指定セッションの現在の盤面（観戦モード用） |

## MCP クライアントからの操作例

```bash
# 1. セッション初期化（レスポンスヘッダーの Mcp-Session-Id を取得）
curl -i -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"initialize",
    "params":{
      "protocolVersion":"2024-11-05",
      "capabilities":{},
      "clientInfo":{"name":"test-client","version":"1.0.0"}
    }
  }'

# 2. 新しいゲームを開始（<SESSION_ID> は上で取得した値）
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: <SESSION_ID>" \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{"name":"new_game","arguments":{}}
  }'
```

## 開発メモ

### フロントエンドでのプレイ

1. `npm run dev`（または `dev:mcp` と `dev:frontend`）でサーバーとフロントエンドを起動
2. ブラウザで `http://localhost:3001` にアクセス
3. 難易度を選択して「新しいゲーム」をクリック
4. 左クリックでセルを開く／右クリックでフラグを立てる

### 観戦モード

`http://localhost:3001/?sessionId=<セッションID>` を開くと、そのセッションの盤面が `/game/:sessionId` のポーリングで表示されます（操作は不可）。

## ゲームルール

- 地雷はゲーム開始時にランダム配置され、最初にクリックしたセルとその周囲 8 マスには配置されません
- 隣接地雷数が 0 のセルを開くと、隣接する安全なセルが再帰的に自動で開きます
- 地雷以外の全セルを開くとクリア、地雷を開くとゲームオーバー
- セッションは最終アクセスから 30 分でクリーンアップされます

## 技術スタック

- **shared**: TypeScript 5.7
- **mcp-server**: Node.js + Express 4 / `@modelcontextprotocol/sdk` / zod / cors / TypeScript 5.7（開発は tsx）
- **frontend**: React 19 / Vite 6 / TailwindCSS 3 / TypeScript 5.7

## ライセンス

MIT

## 参考

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io)
