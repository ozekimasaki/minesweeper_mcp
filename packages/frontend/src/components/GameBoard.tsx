import { useMemo, useCallback, useState, useEffect } from 'react';
import { Cell } from './Cell';
import { DigitalDisplay } from './DigitalDisplay';
import { FaceButton } from './FaceButton';
import { RetroInsetPanel } from './RetroWindow';
import type { GameState, GameStatus } from '@minesweeper-mcp/shared';

// ============================================
// 型定義
// ============================================

interface GameBoardProps {
  gameState: GameState | null;
  gameStatus: GameStatus;
  time: number;
  onRevealCell: (row: number, col: number) => void;
  onToggleFlag: (row: number, col: number) => void;
  onNewGame: () => void;
  onCellMouseDown?: () => void;
  onCellMouseUp?: () => void;
}

// ============================================
// 紙吹雪エフェクトコンポーネント
// ============================================

interface ConfettiProps {
  isActive: boolean;
}

function Confetti({ isActive }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; color: string; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)],
        delay: Math.random() * 0.5,
      }));
      setPieces(newPieces);
      
      // 3秒後にクリア
      const timer = setTimeout(() => setPieces([]), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActive]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// メインコンポーネント
// ============================================

/**
 * マインスイーパーのゲームボードを表示するコンポーネント
 * Windows 95 クラシックスタイル
 */
export function GameBoard({
  gameState,
  gameStatus,
  time,
  onRevealCell,
  onToggleFlag,
  onNewGame,
  onCellMouseDown,
  onCellMouseUp,
}: GameBoardProps) {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // 勝利時に紙吹雪を表示
  useEffect(() => {
    if (gameStatus === 'won') {
      setShowConfetti(true);
    } else {
      setShowConfetti(false);
    }
  }, [gameStatus]);

  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      onToggleFlag(row, col);
    },
    [onToggleFlag]
  );

  const handleCellMouseDown = useCallback(() => {
    setIsMouseDown(true);
    onCellMouseDown?.();
  }, [onCellMouseDown]);

  const handleCellMouseUp = useCallback(() => {
    setIsMouseDown(false);
    onCellMouseUp?.();
  }, [onCellMouseUp]);

  // 残り地雷数を計算
  const remainingMines = useMemo(() => {
    if (!gameState) return 0;
    return gameState.mines - gameState.flaggedCount;
  }, [gameState]);

  // ゲームが開始されていない場合
  if (!gameState) {
    return (
      <RetroInsetPanel className="p-8">
        <p className="text-center text-[11px]">
          難易度を選択して「新しいゲーム」をクリックしてください
        </p>
      </RetroInsetPanel>
    );
  }

  // ボードの幅を計算（セル幅20px * 列数 + パディング分）
  const boardWidth = gameState.cols * 20;
  // コントロールパネルの最小幅（LED 2つ + 顔ボタン + 余白）
  const minControlWidth = 140;
  const controlWidth = Math.max(boardWidth + 6, minControlWidth);

  return (
    <div className="flex flex-col gap-0">
      {/* 紙吹雪エフェクト */}
      <Confetti isActive={showConfetti} />

      {/* コントロールパネル（地雷カウンター、顔ボタン、タイマー） */}
      <div 
        className="win95-inset p-[6px] mb-[6px]"
        style={{ width: `${controlWidth}px` }}
      >
        <div className="flex items-center justify-between gap-1">
          {/* 地雷カウンター */}
          <DigitalDisplay value={remainingMines} digits={3} />
          
          {/* 顔ボタン */}
          <FaceButton
            gameStatus={gameStatus}
            isMouseDown={isMouseDown}
            onClick={onNewGame}
          />
          
          {/* タイマー */}
          <DigitalDisplay value={time} digits={3} />
        </div>
      </div>

      {/* ゲームボード */}
      <div 
        className={`win95-inset p-[3px] self-center ${gameStatus === 'lost' ? 'animate-shake' : ''}`}
        onMouseUp={handleCellMouseUp}
        onMouseLeave={() => setIsMouseDown(false)}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gameState.cols}, 20px)`,
            gap: '0px',
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
                onMouseDown={handleCellMouseDown}
                onMouseUp={handleCellMouseUp}
              />
            ))
          )}
        </div>
      </div>

      {/* ステータスメッセージ */}
      <GameStatusMessage status={gameStatus} />
    </div>
  );
}

// ============================================
// サブコンポーネント
// ============================================

interface GameStatusMessageProps {
  status: GameStatus;
}

/** ゲームステータスメッセージ */
function GameStatusMessage({ status }: GameStatusMessageProps) {
  if (status === 'playing') return null;

  const message = status === 'won' 
    ? '🎉 おめでとう！クリアしました！' 
    : '💥 ゲームオーバー';
  
  const colorClass = status === 'won' 
    ? 'text-green-700' 
    : 'text-red-700';

  return (
    <div className={`text-center text-sm font-bold mt-2 ${colorClass}`}>
      {message}
    </div>
  );
}
