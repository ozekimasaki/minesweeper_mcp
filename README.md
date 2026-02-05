# Minesweeper MCP

マインスイーパーゲームとMCP（Model Context Protocol）サーバーを統合したWebアプリケーション。

## 特徴

- **通常プレイ**: React + TypeScriptで構築されたフロントエンドでマインスイーパーをプレイ
- **MCP連携**: 外部MCPクライアント（LLM等）からゲームを操作可能
- **難易度設定**: 3段階の難易度（初級・中級・上級）
- **リアルタイム監視**: MCPサーバーの稼働状況を表示

## 難易度

| 難易度 | 行数 | 列数 | 地雷数 | 利用可能なプレイ方法 |
|--------|------|------|--------|-------------------|
| 初級 | 9 | 9 | 10 | 通常プレイのみ |
| 中級 | 16 | 16 | 40 | 通常プレイのみ |
| 上級 | 16 | 30 | 99 | 通常プレイ・MCP |

※ MCP経由でのプレイは**上級**のみ利用可能です。

## プロジェクト構成

```
minesweeper_mcp/
├── packages/
│   ├── shared/          # 共通ゲームロジック・型定義
│   ├── mcp-server/      # MCPサーバー（ポート4000）
│   └── frontend/        # Reactフロントエンド（ポート3001）
├── package.json
└── README.md
```

## MCP Tools

MCPサーバーは以下のツールを提供します：

### `reveal_cell`
指定された位置のセルを開きます。

**入力:**
```json
{
  "row": 0,
  "col": 0
}
```

**出力:**
```json
{
  "revealed": true,
  "isMine": false,
  "neighborMines": 0,
  "gameStatus": "playing"
}
```

### `flag_cell`
指定された位置のセルにフラグを立てる/外します。

**入力:**
```json
{
  "row": 0,
  "col": 0
}
```

**出力:**
```json
{
  "flagged": true,
  "flaggedCount": 1
}
```

### `new_game`
新しいゲームを開始します。MCP経由では常に上級で開始されます。

**入力:**
```json
{}
```

**出力:**
```
Started new game (Advanced: 16×30, 99 mines)
Game ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### `reset_game`
現在のゲームを同じ難易度でリセットします。

**入力:**
```json
{}
```

**出力:**
```
Game reset. Game ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## MCP Resources

MCPサーバーは以下のリソースを提供します：

### `board://current`
現在のゲーム盤面の状態を取得します。

**出力:**
```json
{
  "id": "game-id",
  "difficulty": "advanced",
  "rows": 16,
  "cols": 30,
  "mines": 99,
  "board": [...],
  "status": "playing",
  "revealedCount": 0,
  "flaggedCount": 0
}
```

### `game://info`
現在のゲーム情報と統計を取得します。

**出力:**
```json
{
  "id": "game-id",
  "difficulty": "advanced",
  "rows": 16,
  "cols": 30,
  "mines": 99,
  "status": "playing"
}
```

## セットアップ

### 前提条件

- Node.js >= 18.0.0
- npm >= 9.0.0

### インストール

```bash
# 依存パッケージをインストール
npm install
```

### 実行

#### 全てのサービスを起動

```bash
npm run dev
```

これにより、MCPサーバー（ポート4000）とフロントエンド（ポート3001）が同時に起動します。

#### MCPサーバーのみ起動

```bash
npm run dev:mcp
```

MCPサーバーが `http://localhost:4000/mcp` で待ち受けします。

#### フロントエンドのみ起動

```bash
npm run dev:frontend
```

ブラウザで `http://localhost:3001` にアクセスしてゲームをプレイできます。

## ビルド

```bash
# 全てのパッケージをビルド
npm run build

# 個別にビルド
npm run build:shared      # 共通パッケージ
npm run build:mcp-server  # MCPサーバー
npm run build:frontend    # フロントエンド
```

## 開発

### フロントエンド（通常プレイ）

1. `npm run dev:frontend` でフロントエンドを起動
2. ブラウザで `http://localhost:3001` にアクセス
3. 難易度を選択して「新しいゲーム」をクリック
4. 左クリックでセルを開く
5. 右クリックでフラグを立てる

### MCPサーバー経由での操作

1. MCPサーバーを起動: `npm run dev:mcp`
2. MCPクライアントで `http://localhost:4000/mcp` に接続
3. セッション初期化:
   ```bash
   curl -X POST http://localhost:4000/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{
       "jsonrpc":"2.0",
       "id":1,
       "method":"initialize",
       "params":{
         "protocolVersion":"2024-11-05",
         "capabilities":{},
         "clientInfo":{"name":"test-client","version":"1.0.0"}
       }
     }'
   ```
4. レスポンスヘッダーから `Mcp-Session-Id` を取得
5. ゲーム開始（上級）:
   ```bash
   curl -X POST http://localhost:4000/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -H "Mcp-Session-Id: <SESSION_ID>" \
     -d '{
       "jsonrpc":"2.0",
       "id":2,
       "method":"tools/call",
       "params":{"name":"new_game","arguments":{}}
     }'
   ```

## テクノロジー

- マインはゲーム開始時にランダムに配置されます
- 最初のクリックは必ず地雷ではありません（最初のクリック後にマイン配置が生成されます）
- 隣接地雷数が0のセルを開くと、隣接する全ての安全なセルが自動的に開きます
- 全ての地雷以外のセルを開くとゲームクリア
- 地雷を開くとゲームオーバー

## 技術スタック

### 共通パッケージ
- TypeScript 5.7

### MCPサーバー
- Node.js + Express
- @modelcontextprotocol/sdk v1.26.0
- TypeScript 5.7

### フロントエンド
- React 19
- TypeScript 5.7
- Vite 6
- TailwindCSS 3

## ライセンス

MIT

## 貢献

プルリクエストやIssueは大歓迎です。

## 参考

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io)
