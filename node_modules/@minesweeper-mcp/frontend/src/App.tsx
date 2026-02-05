import { useState } from 'react';
import { useMinesweeper } from './hooks/useMinesweeper';
import { DifficultySelector } from './components/DifficultySelector';
import { GameBoard } from './components/GameBoard';
import { MCPStatus } from './components/MCPStatus';
import { MCP_ENDPOINT } from './config';
import type { Difficulty } from '@minesweeper-mcp/shared';

/**
 * マインスイーパーアプリケーションのルートコンポーネント
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

  const handleStartGame = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    startNewGame(diff);
  };

  const isGameOver = gameStatus !== 'playing';

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <Header isSpectatorMode={isSpectatorMode} isConnected={isConnected} />

        {/* メインコンテンツ */}
        <main className="space-y-6">
          {/* 難易度選択（観戦モードでは非表示） */}
          {!isSpectatorMode && (
            <DifficultySelector
              currentDifficulty={selectedDifficulty}
              onSelectDifficulty={setSelectedDifficulty}
              onStartGame={handleStartGame}
            />
          )}

          {/* ゲームオーバー時のボタン */}
          {!isSpectatorMode && gameState && isGameOver && (
            <GameOverActions
              onRetry={resetGame}
              onNewGame={() => handleStartGame(selectedDifficulty)}
            />
          )}

          {/* ゲームボード */}
          <GameBoard
            gameState={gameState}
            gameStatus={gameStatus}
            onRevealCell={isSpectatorMode ? () => Promise.resolve(null) : revealCell}
            onToggleFlag={isSpectatorMode ? () => Promise.resolve(null) : toggleFlag}
          />

          {/* 観戦モードメッセージ */}
          {isSpectatorMode && (
            <div className="text-center text-gray-500">
              観戦モード - ゲームはリアルタイムで更新されます
            </div>
          )}
        </main>

        {/* フッター */}
        <Footer />
      </div>
    </div>
  );
}

// ============================================
// サブコンポーネント
// ============================================

interface HeaderProps {
  isSpectatorMode: boolean;
  isConnected: boolean;
}

function Header({ isSpectatorMode, isConnected }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          マインスイーパー
          {isSpectatorMode && (
            <span className="ml-2 text-lg font-normal text-blue-600">
              (観戦モード)
            </span>
          )}
        </h1>
        <p className="text-gray-600">MCP対応のマインスイーパーゲーム</p>
      </div>
      <MCPStatus isConnected={isConnected} />
    </header>
  );
}

interface GameOverActionsProps {
  onRetry: () => void;
  onNewGame: () => void;
}

function GameOverActions({ onRetry, onNewGame }: GameOverActionsProps) {
  return (
    <div className="flex justify-center gap-4">
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
      >
        リトライ
      </button>
      <button
        onClick={onNewGame}
        className="px-6 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 transition-colors"
      >
        新しいゲーム
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-8 text-center text-sm text-gray-600">
      <p>左クリック: セルを開く | 右クリック: フラグを立てる</p>
      <p className="mt-2">
        MCPサーバー:
        <a
          href={MCP_ENDPOINT}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline ml-1"
        >
          {MCP_ENDPOINT}
        </a>
      </p>
    </footer>
  );
}
