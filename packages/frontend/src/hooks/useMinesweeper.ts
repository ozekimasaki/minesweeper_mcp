import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { McpClient } from '../mcp/McpClient';
import {
  MCP_ENDPOINT,
  getGameEndpoint,
  SPECTATOR_POLL_INTERVAL_MS,
} from '../config';
import type { Difficulty, GameState, RevealResult, FlagResult, GameStatus } from '@minesweeper-mcp/shared';

// ============================================
// ユーティリティ関数
// ============================================

/** URLパラメータからセッションIDを取得 */
function getWatchSessionIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('sessionId');
}

// ============================================
// 戻り値の型定義
// ============================================

interface UseMinesweeperReturn {
  /** 現在の難易度 */
  difficulty: Difficulty;
  /** ゲーム状態 */
  gameState: GameState | null;
  /** ゲームステータス */
  gameStatus: GameStatus;
  /** MCPサーバーに接続済みか */
  isConnected: boolean;
  /** 観戦モードか */
  isSpectatorMode: boolean;
  /** 新しいゲームを開始 */
  startNewGame: (difficulty: Difficulty) => Promise<void>;
  /** セルを開く */
  revealCell: (row: number, col: number) => Promise<RevealResult | null>;
  /** フラグを切り替え */
  toggleFlag: (row: number, col: number) => Promise<FlagResult | null>;
  /** ゲームをリセット */
  resetGame: () => Promise<void>;
}

// ============================================
// カスタムフック
// ============================================

/**
 * マインスイーパーゲームの状態管理フック
 */
export function useMinesweeper(): UseMinesweeperReturn {
  // State
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpectatorMode, setIsSpectatorMode] = useState(false);

  // Refs
  const mcpClient = useRef(new McpClient(MCP_ENDPOINT));
  const hasTriedConnect = useRef(false);

  // 観戦モードのセットアップ
  useSpectatorMode(setIsSpectatorMode, setIsConnected, setGameState, setDifficulty);

  // 通常モードのMCP接続
  useNormalModeConnection(mcpClient, hasTriedConnect, setIsConnected);

  // ============================================
  // ゲーム操作
  // ============================================

  const startNewGame = useCallback(async (diff: Difficulty) => {
    if (isSpectatorMode) return;

    try {
      const state = await mcpClient.current.startNewGame(diff);
      setDifficulty(diff);
      setGameState(state);
    } catch (error) {
      console.error('Failed to start new game:', error);
    }
  }, [isSpectatorMode]);

  const revealCell = useCallback(async (row: number, col: number): Promise<RevealResult | null> => {
    if (isSpectatorMode) return null;

    try {
      const result = await mcpClient.current.revealCell(row, col);
      const state = await mcpClient.current.getBoardState();
      setGameState(state);
      return result;
    } catch (error) {
      console.error('Failed to reveal cell:', error);
      return null;
    }
  }, [isSpectatorMode]);

  const toggleFlag = useCallback(async (row: number, col: number): Promise<FlagResult | null> => {
    if (isSpectatorMode) return null;

    try {
      const result = await mcpClient.current.flagCell(row, col);
      const state = await mcpClient.current.getBoardState();
      setGameState(state);
      return result;
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      return null;
    }
  }, [isSpectatorMode]);

  const resetGame = useCallback(async () => {
    if (isSpectatorMode) return;

    try {
      const state = await mcpClient.current.resetGame();
      setGameState(state);
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  }, [isSpectatorMode]);

  // Derived state
  const gameStatus = useMemo<GameStatus>(
    () => gameState?.status ?? 'playing',
    [gameState]
  );

  return {
    difficulty,
    gameState,
    gameStatus,
    isConnected,
    isSpectatorMode,
    startNewGame,
    revealCell,
    toggleFlag,
    resetGame,
  };
}

// ============================================
// 内部フック
// ============================================

/**
 * 観戦モードの管理
 */
function useSpectatorMode(
  setIsSpectatorMode: (value: boolean) => void,
  setIsConnected: (value: boolean) => void,
  setGameState: (state: GameState | null) => void,
  setDifficulty: (difficulty: Difficulty) => void
): void {
  useEffect(() => {
    const watchSessionId = getWatchSessionIdFromUrl();
    if (!watchSessionId) return;

    setIsSpectatorMode(true);
    setIsConnected(true);

    const fetchGameState = async () => {
      try {
        const response = await fetch(getGameEndpoint(watchSessionId));
        if (response.ok) {
          const state: GameState = await response.json();
          setGameState(state);
          setDifficulty(state.difficulty);
        }
      } catch (error) {
        console.error('Failed to fetch game state:', error);
      }
    };

    // 初回取得 + 定期ポーリング
    fetchGameState();
    const interval = setInterval(fetchGameState, SPECTATOR_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [setIsSpectatorMode, setIsConnected, setGameState, setDifficulty]);
}

/**
 * 通常モードのMCP接続管理
 */
function useNormalModeConnection(
  mcpClient: React.MutableRefObject<McpClient>,
  hasTriedConnect: React.MutableRefObject<boolean>,
  setIsConnected: (value: boolean) => void
): void {
  useEffect(() => {
    // 観戦モードの場合はスキップ
    if (getWatchSessionIdFromUrl()) return;

    // 既に接続を試みた場合はスキップ
    if (hasTriedConnect.current) return;
    hasTriedConnect.current = true;

    const connectToMcp = async () => {
      try {
        await mcpClient.current.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to MCP server:', error);
        setIsConnected(false);
      }
    };

    connectToMcp();

    return () => {
      mcpClient.current.disconnect();
    };
  }, [mcpClient, hasTriedConnect, setIsConnected]);
}
