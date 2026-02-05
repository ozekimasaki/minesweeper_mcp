import { useMemo, useCallback } from 'react';
import { Cell } from './Cell';
import type { GameState, GameStatus } from '@minesweeper-mcp/shared';

// ============================================
// 定数
// ============================================

const STATUS_MESSAGES: Record<GameStatus, string> = {
  won: '🎉 ゲームクリア！',
  lost: '💥 ゲームオーバー',
  playing: 'ゲーム進行中',
} as const;

const STATUS_COLORS: Record<GameStatus, string> = {
  won: 'text-green-600',
  lost: 'text-red-600',
  playing: 'text-gray-800',
} as const;

// ============================================
// コンポーネント
// ============================================

interface GameBoardProps {
  gameState: GameState | null;
  gameStatus: GameStatus;
  onRevealCell: (row: number, col: number) => void;
  onToggleFlag: (row: number, col: number) => void;
}

/**
 * マインスイーパーのゲームボードを表示するコンポーネント
 */
export function GameBoard({
  gameState,
  gameStatus,
  onRevealCell,
  onToggleFlag,
}: GameBoardProps) {
  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      onToggleFlag(row, col);
    },
    [onToggleFlag]
  );

  const statusMessage = useMemo(
    () => STATUS_MESSAGES[gameStatus],
    [gameStatus]
  );

  const statusColor = useMemo(
    () => STATUS_COLORS[gameStatus],
    [gameStatus]
  );

  // ゲームが開始されていない場合
  if (!gameState) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-lg text-gray-600">新しいゲームを開始してください</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ステータスメッセージ */}
      <div className={`text-2xl font-bold ${statusColor}`}>
        {statusMessage}
      </div>

      {/* 地雷とフラグのカウンター */}
      <GameStats mines={gameState.mines} flaggedCount={gameState.flaggedCount} />

      {/* ゲームボード */}
      <div className="inline-block bg-gray-600 p-1 rounded">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${gameState.cols}, minmax(0, 1fr))`,
          }}
        >
          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                gameStatus={gameStatus}
                onClick={() => onRevealCell(rowIndex, colIndex)}
                onRightClick={(e) => handleCellRightClick(e, rowIndex, colIndex)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// サブコンポーネント
// ============================================

interface GameStatsProps {
  mines: number;
  flaggedCount: number;
}

/** ゲーム統計（地雷数とフラグ数） */
function GameStats({ mines, flaggedCount }: GameStatsProps) {
  return (
    <div className="flex gap-8 text-lg">
      <div>
        <span className="font-semibold">地雷:</span> {mines}
      </div>
      <div>
        <span className="font-semibold">旗:</span> {flaggedCount}
      </div>
    </div>
  );
}
