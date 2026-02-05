import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameStatus } from '@minesweeper-mcp/shared';

// ============================================
// 型定義
// ============================================

interface UseTimerOptions {
  maxTime?: number;  // 最大時間（秒）
  autoStart?: boolean;
}

interface UseTimerReturn {
  time: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// ============================================
// メインフック
// ============================================

/**
 * マインスイーパー用タイマーフック
 * ゲーム開始から経過時間を計測
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { maxTime = 999, autoStart = false } = options;
  
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // タイマー開始
  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
    }
  }, [isRunning]);

  // タイマー停止
  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  // タイマーリセット
  const reset = useCallback(() => {
    setTime(0);
    setIsRunning(false);
  }, []);

  // インターバル管理
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime >= maxTime) {
            return maxTime;
          }
          return prevTime + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, maxTime]);

  return {
    time,
    isRunning,
    start,
    stop,
    reset,
  };
}

// ============================================
// ゲーム状態連動タイマーフック
// ============================================

interface UseGameTimerOptions {
  maxTime?: number;
}

interface UseGameTimerReturn {
  time: number;
  isRunning: boolean;
  resetTimer: () => void;
}

/**
 * ゲーム状態に連動するタイマーフック
 * - playing時に自動で開始
 * - won/lost時に自動で停止
 */
export function useGameTimer(
  gameStatus: GameStatus,
  hasStarted: boolean,
  options: UseGameTimerOptions = {}
): UseGameTimerReturn {
  const { maxTime = 999 } = options;
  
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ゲーム状態変化に応じてタイマーを制御
  useEffect(() => {
    if (gameStatus === 'playing' && hasStarted) {
      setIsRunning(true);
    } else if (gameStatus === 'won' || gameStatus === 'lost') {
      setIsRunning(false);
    }
  }, [gameStatus, hasStarted]);

  // タイマーリセット
  const resetTimer = useCallback(() => {
    setTime(0);
    setIsRunning(false);
  }, []);

  // インターバル管理
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime >= maxTime) {
            return maxTime;
          }
          return prevTime + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, maxTime]);

  return {
    time,
    isRunning,
    resetTimer,
  };
}
