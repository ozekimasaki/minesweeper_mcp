import type { Difficulty, GameState, RevealResult, FlagResult } from '@minesweeper-mcp/shared';
import { MCP_PROTOCOL_VERSION, MCP_CLIENT_INFO } from '../config';

// ============================================
// 型定義
// ============================================

/** MCP リクエストの基本構造 */
interface McpRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

/** MCP レスポンスの基本構造 */
interface McpResponse {
  jsonrpc: '2.0';
  id: number;
  result?: McpResult;
  error?: McpError;
}

/** MCP エラー */
interface McpError {
  code: number;
  message: string;
}

/** MCP 結果 */
interface McpResult {
  content?: Array<{ type: string; text?: string }>;
  contents?: Array<{ text?: string }>;
}

// ============================================
// カスタムエラー
// ============================================

/** MCP 通信エラー */
export class McpClientError extends Error {
  constructor(
    message: string,
    public readonly code?: number
  ) {
    super(message);
    this.name = 'McpClientError';
  }
}

// ============================================
// MCP クライアント
// ============================================

/**
 * MCP サーバーとの通信を管理するクライアント
 */
export class McpClient {
  private readonly serverUrl: string;
  private sessionId: string | null = null;
  private requestId = 1;

  constructor(serverUrl: string, sessionId?: string) {
    this.serverUrl = serverUrl;
    this.sessionId = sessionId ?? null;
  }

  // ============================================
  // 接続管理
  // ============================================

  /** MCP サーバーに接続 */
  async connect(): Promise<void> {
    const response = await this.sendRequest({
      method: 'initialize',
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: MCP_CLIENT_INFO,
      },
    });

    this.validateResponse(response, 'initialize');

    // セッションIDが設定されていない場合は少し待ってから確認
    if (!this.sessionId) {
      await this.waitForSessionId();
    }

    console.log('Connected to MCP server, session ID:', this.sessionId);
  }

  /** MCP サーバーから切断 */
  async disconnect(): Promise<void> {
    if (!this.sessionId) return;

    try {
      await fetch(`${this.serverUrl}?sessionId=${this.sessionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      this.sessionId = null;
    }
  }

  /** 接続状態を確認 */
  isConnected(): boolean {
    return this.sessionId !== null;
  }

  /** 現在のセッションIDを取得 */
  getSessionId(): string | null {
    return this.sessionId;
  }

  // ============================================
  // ゲーム操作
  // ============================================

  /** 新しいゲームを開始 */
  async startNewGame(difficulty?: Difficulty): Promise<GameState> {
    await this.callTool('new_game', difficulty ? { difficulty } : {});
    return this.getBoardState();
  }

  /** セルを開く */
  async revealCell(row: number, col: number): Promise<RevealResult> {
    return this.callToolWithResult<RevealResult>('reveal_cell', { row, col });
  }

  /** フラグを切り替え */
  async flagCell(row: number, col: number): Promise<FlagResult> {
    return this.callToolWithResult<FlagResult>('flag_cell', { row, col });
  }

  /** ゲームをリセット */
  async resetGame(): Promise<GameState> {
    await this.callTool('reset_game', {});
    return this.getBoardState();
  }

  /** 現在のボード状態を取得 */
  async getBoardState(): Promise<GameState> {
    const response = await this.sendRequest({
      method: 'resources/read',
      params: { uri: 'board://current' },
    });

    this.validateResponse(response, 'get board state');

    const content = response.result?.contents?.[0];
    if (!content || !('text' in content) || !content.text) {
      throw new McpClientError('Invalid response format for board state');
    }

    return this.parseJson<GameState>(content.text);
  }

  // ============================================
  // Private メソッド
  // ============================================

  /** ツールを呼び出し */
  private async callTool(name: string, args: Record<string, unknown>): Promise<McpResponse> {
    const response = await this.sendRequest({
      method: 'tools/call',
      params: { name, arguments: args },
    });

    this.validateResponse(response, name);
    return response;
  }

  /** ツールを呼び出して結果を取得 */
  private async callToolWithResult<T>(name: string, args: Record<string, unknown>): Promise<T> {
    const response = await this.callTool(name, args);

    const content = response.result?.content?.[0];
    if (!content || content.type !== 'text' || !content.text) {
      throw new McpClientError(`Invalid response format for ${name}`);
    }

    return this.parseJson<T>(content.text);
  }

  /** MCP リクエストを送信 */
  private async sendRequest(params: Omit<McpRequest, 'jsonrpc' | 'id'>): Promise<McpResponse> {
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      ...params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new McpClientError(`HTTP ${response.status}: ${response.statusText}`);
    }

    return this.parseResponse(response, request.id);
  }

  /** レスポンスを解析 */
  private async parseResponse(response: Response, requestId: number): Promise<McpResponse> {
    const text = await response.text();

    // セッションIDをヘッダーから取得
    this.updateSessionIdFromHeaders(response);

    // SSE形式のレスポンスを処理
    if (text.includes('event: message')) {
      return this.parseSseResponse(text, requestId, response);
    }

    return this.parseJson<McpResponse>(text);
  }

  /** SSE形式のレスポンスを解析 */
  private parseSseResponse(text: string, requestId: number, response: Response): McpResponse {
    const lines = text.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const data = this.parseJson<McpResponse>(line.substring(6));
      if (data.jsonrpc === '2.0' && data.id === requestId) {
        this.updateSessionIdFromHeaders(response);
        return data;
      }
    }

    throw new McpClientError('Failed to parse SSE response');
  }

  /** レスポンスを検証 */
  private validateResponse(response: McpResponse, operation: string): void {
    if (response.error) {
      throw new McpClientError(
        `Failed to ${operation}: ${response.error.message}`,
        response.error.code
      );
    }
  }

  /** ヘッダーからセッションIDを更新 */
  private updateSessionIdFromHeaders(response: Response): void {
    if (!this.sessionId && response.headers.has('mcp-session-id')) {
      this.sessionId = response.headers.get('mcp-session-id');
    }
  }

  /** セッションIDが設定されるまで待機 */
  private async waitForSessionId(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));

    if (!this.sessionId) {
      throw new McpClientError('Failed to get session ID from MCP server');
    }
  }

  /** JSON を安全にパース */
  private parseJson<T>(text: string): T {
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new McpClientError(`Failed to parse JSON: ${text.substring(0, 100)}...`);
    }
  }
}
