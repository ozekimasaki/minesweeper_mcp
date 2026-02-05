import { useState, useCallback, useEffect } from 'react';
import { useMinesweeper } from './hooks/useMinesweeper';
import { useGameTimer } from './hooks/useTimer';
import { useSound } from './hooks/useSound';
import { DifficultySelector } from './components/DifficultySelector';
import { GameBoard } from './components/GameBoard';
import { MCPStatus } from './components/MCPStatus';
import { RetroWindow, RetroStatusBar } from './components/RetroWindow';
import { SoundControl } from './components/SoundControl';
import type { Difficulty } from '@minesweeper-mcp/shared';

// ============================================
// メインコンポーネント
// ============================================

/**
 * マインスイーパーアプリケーションのルートコンポーネント
 * Windows 95 クラシックスタイル
 */
export default function App() {
  const {
    difficulty,
    gameState,
    gameStatus,
    isConnected,
    isSpectatorMode,
    startNewGame,
    revealCell,
    toggleFlag,
    resetGame,
  } = useMinesweeper();

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(difficulty);
  const [hasStarted, setHasStarted] = useState(false);

  // タイマー
  const { time, resetTimer } = useGameTimer(gameStatus, hasStarted);

  // 効果音
  const { playSound, isEnabled: soundEnabled, setEnabled: setSoundEnabled } = useSound();

  // ゲーム開始時の処理
  const handleStartGame = useCallback((diff: Difficulty) => {
    setSelectedDifficulty(diff);
    startNewGame(diff);
    resetTimer();
    setHasStarted(false);
    playSound('newGame');
  }, [startNewGame, resetTimer, playSound]);

  // 顔ボタンクリック時のリセット
  const handleFaceClick = useCallback(() => {
    resetGame();
    resetTimer();
    setHasStarted(false);
    playSound('newGame');
  }, [resetGame, resetTimer, playSound]);

  // セルクリック時の処理
  const handleRevealCell = useCallback(async (row: number, col: number) => {
    if (!hasStarted) {
      setHasStarted(true);
    }
    playSound('click');
    const result = await revealCell(row, col);
    
    // 結果に応じて効果音を再生
    if (result) {
      if (gameStatus === 'lost') {
        playSound('explode');
      } else if (gameStatus === 'won') {
        playSound('win');
      } else {
        playSound('reveal');
      }
    }
    return result;
  }, [hasStarted, revealCell, playSound, gameStatus]);

  // フラグ切り替え時の処理
  const handleToggleFlag = useCallback(async (row: number, col: number) => {
    const cell = gameState?.board[row]?.[col];
    if (cell?.state === 'flagged') {
      playSound('unflag');
    } else {
      playSound('flag');
    }
    return toggleFlag(row, col);
  }, [toggleFlag, playSound, gameState]);

  // ゲーム状態変化時の効果音
  useEffect(() => {
    if (gameStatus === 'won') {
      playSound('win');
    } else if (gameStatus === 'lost') {
      playSound('explode');
    }
  }, [gameStatus, playSound]);

  const isGameOver = gameStatus !== 'playing';

  return (
    <div className="min-h-screen bg-[#008080] p-4 flex items-center justify-center">
      <RetroWindow 
        title="マインスイーパー" 
        icon="💣"
      >
        {/* メインコンテンツ */}
        <div className="p-2">
          {/* 観戦モードでない場合は難易度選択を表示 */}
          {!isSpectatorMode && !gameState && (
            <DifficultySelector
              currentDifficulty={selectedDifficulty}
              onSelectDifficulty={setSelectedDifficulty}
              onStartGame={handleStartGame}
            />
          )}

          {/* ゲームボード */}
          {gameState && (
            <GameBoard
              gameState={gameState}
              gameStatus={gameStatus}
              time={time}
              onRevealCell={isSpectatorMode ? async () => null : handleRevealCell}
              onToggleFlag={isSpectatorMode ? async () => null : handleToggleFlag}
              onNewGame={handleFaceClick}
            />
          )}

          {/* ゲームオーバー時のボタン（観戦モード以外） */}
          {!isSpectatorMode && gameState && isGameOver && (
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={handleFaceClick}
                className="win95-button px-3 py-1 text-[11px]"
              >
                リトライ
              </button>
              <button
                onClick={() => handleStartGame(selectedDifficulty)}
                className="win95-button px-3 py-1 text-[11px]"
              >
                新しいゲーム
              </button>
            </div>
          )}

          {/* 難易度変更ボタン（ゲーム中） */}
          {!isSpectatorMode && gameState && (
            <div className="flex justify-center gap-2 mt-3">
              <DifficultySelector
                currentDifficulty={selectedDifficulty}
                onSelectDifficulty={setSelectedDifficulty}
                onStartGame={handleStartGame}
              />
            </div>
          )}
        </div>

        {/* ステータスバー */}
        <RetroStatusBar>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MCPStatus isConnected={isConnected} />
              {isSpectatorMode && (
                <span className="text-[10px] text-blue-700">観戦モード</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SoundControl 
                isEnabled={soundEnabled} 
                onToggle={setSoundEnabled} 
              />
            </div>
          </div>
        </RetroStatusBar>
      </RetroWindow>

      {/* フッター情報 */}
      <Footer />
    </div>
  );
}

// ============================================
// サブコンポーネント
// ============================================

function Footer() {
  return (
    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 text-white/60 text-[10px] text-center">
      <p>左クリック: セルを開く | 右クリック: フラグを立てる</p>
      <p className="mt-1">MCP対応マインスイーパー</p>
    </div>
  );
}
