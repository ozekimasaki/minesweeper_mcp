import { useEffect, useState, useCallback } from 'react';
import {
  HEALTH_ENDPOINT,
  SESSIONS_ENDPOINT,
  HEALTH_CHECK_INTERVAL_MS,
  SESSIONS_POLL_INTERVAL_MS,
} from '../config';

// ============================================
// 型定義
// ============================================

interface MCPStatusProps {
  mcpServerUrl?: string; // 後方互換性のため残す（未使用）
  isConnected?: boolean;
}

interface HealthStatus {
  status: string;
  activeSessions: number;
}

// ============================================
// カスタムフック
// ============================================

/** MCPサーバーのヘルスチェック */
function useHealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(HEALTH_ENDPOINT);
        if (response.ok) {
          const data: HealthStatus = await response.json();
          setHealth(data);
          setIsOnline(true);
          setError(null);
        } else {
          setIsOnline(false);
          setError(`Server returned ${response.status}`);
        }
      } catch (err) {
        setIsOnline(false);
        setError(err instanceof Error ? err.message : 'Connection failed');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return { health, isOnline, error };
}

/** セッション一覧の取得 */
function useSessions() {
  const [sessions, setSessions] = useState<string[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(SESSIONS_ENDPOINT);
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions ?? []);
        }
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, SESSIONS_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return sessions;
}

/** 現在のセッションID（URLパラメータから取得） */
function useCurrentSessionId(): string | null {
  return new URLSearchParams(window.location.search).get('sessionId');
}

// ============================================
// サブコンポーネント
// ============================================

interface SessionDropdownProps {
  sessions: string[];
  onWatchSession: (sessionId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

/** セッション選択ドロップダウン */
function SessionDropdown({ sessions, onWatchSession, isOpen, onToggle }: SessionDropdownProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
      >
        観戦 ({sessions.length})
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 min-w-[200px]">
          <div className="p-2 text-xs text-gray-500 border-b">
            アクティブなセッション
          </div>
          {sessions.map((sessionId, index) => (
            <button
              key={sessionId}
              onClick={() => onWatchSession(sessionId)}
              className="block w-full text-left px-3 py-2 text-xs hover:bg-blue-50 truncate"
              title={sessionId}
            >
              Session {index + 1}: {sessionId.slice(0, 8)}...
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface StatusIndicatorProps {
  isOnline: boolean;
  isConnected?: boolean;
  health: HealthStatus | null;
  error: string | null;
}

/** 接続状態インジケーター */
function StatusIndicator({ isOnline, isConnected, health, error }: StatusIndicatorProps) {
  return (
    <>
      <div
        className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span className="text-sm">
        {isOnline ? (
          <>
            <span className="font-semibold text-green-700">
              {isConnected !== false ? 'MCP Connected' : 'MCP Online'}
            </span>
            {health && (
              <span className="text-gray-600">
                {' '}(Sessions: {health.activeSessions})
              </span>
            )}
          </>
        ) : (
          <span className="font-semibold text-red-700">MCP Offline</span>
        )}
      </span>
      {error && (
        <span className="text-xs text-red-600 ml-2" title={error}>
          ⚠️
        </span>
      )}
    </>
  );
}

// ============================================
// メインコンポーネント
// ============================================

/**
 * MCPサーバーの接続状態を表示するコンポーネント
 */
export function MCPStatus({ isConnected }: MCPStatusProps) {
  const { health, isOnline, error } = useHealthCheck();
  const sessions = useSessions();
  const currentSessionId = useCurrentSessionId();
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  const watchSession = useCallback((sessionId: string) => {
    const url = new URL(window.location.origin);
    url.searchParams.set('sessionId', sessionId);
    window.location.href = url.toString();
  }, []);

  const exitSpectatorMode = useCallback(() => {
    window.location.href = window.location.origin;
  }, []);

  const toggleDropdown = useCallback(() => {
    setShowSessionDropdown(prev => !prev);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg relative">
      <StatusIndicator
        isOnline={isOnline}
        isConnected={isConnected}
        health={health}
        error={error}
      />

      {currentSessionId ? (
        <button
          onClick={exitSpectatorMode}
          className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          観戦終了
        </button>
      ) : (
        <SessionDropdown
          sessions={sessions}
          onWatchSession={watchSession}
          isOpen={showSessionDropdown}
          onToggle={toggleDropdown}
        />
      )}
    </div>
  );
}
