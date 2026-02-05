/**
 * フロントエンド設定
 * 環境変数や定数を一元管理
 */

// ============================================
// サーバー設定
// ============================================

/** MCPサーバーのベースURL */
export const MCP_SERVER_BASE_URL = 'http://localhost:4000';

/** MCPエンドポイント */
export const MCP_ENDPOINT = `${MCP_SERVER_BASE_URL}/mcp`;

/** ヘルスチェックエンドポイント */
export const HEALTH_ENDPOINT = `${MCP_SERVER_BASE_URL}/health`;

/** セッション一覧エンドポイント */
export const SESSIONS_ENDPOINT = `${MCP_SERVER_BASE_URL}/sessions`;

/** ゲーム状態取得エンドポイント */
export const getGameEndpoint = (sessionId: string) => `${MCP_SERVER_BASE_URL}/game/${sessionId}`;

// ============================================
// ポーリング間隔（ミリ秒）
// ============================================

/** ヘルスチェックの間隔 */
export const HEALTH_CHECK_INTERVAL_MS = 5000;

/** セッション一覧更新の間隔 */
export const SESSIONS_POLL_INTERVAL_MS = 3000;

/** 観戦モード時のゲーム状態更新間隔 */
export const SPECTATOR_POLL_INTERVAL_MS = 500;

// ============================================
// MCPクライアント設定
// ============================================

/** MCPプロトコルバージョン */
export const MCP_PROTOCOL_VERSION = '2024-11-05';

/** クライアント情報 */
export const MCP_CLIENT_INFO = {
  name: 'minesweeper-frontend',
  version: '1.0.0',
} as const;
