import type { Cell as CellType, GameStatus } from '@minesweeper-mcp/shared';

// ============================================
// 定数定義
// ============================================

/** 周囲の地雷数に対応する文字色 */
const NEIGHBOR_MINE_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-green-600',
  3: 'text-red-600',
  4: 'text-purple-600',
  5: 'text-red-800',
  6: 'text-teal-600',
  7: 'text-black',
  8: 'text-gray-600',
} as const;

/** セルの表示内容 */
const CELL_CONTENTS = {
  FLAG: '🚩',
  MINE: '💣',
  EMPTY: '',
} as const;

// ============================================
// コンポーネント
// ============================================

interface CellProps {
  cell: CellType;
  gameStatus: GameStatus;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

/**
 * マインスイーパーの個々のセルを表示するコンポーネント
 */
export function Cell({ cell, gameStatus, onClick, onRightClick }: CellProps) {
  const isGameOver = gameStatus !== 'playing';
  const isClickable = cell.state !== 'revealed' && !isGameOver;

  return (
    <button
      onClick={onClick}
      onContextMenu={onRightClick}
      disabled={!isClickable}
      className={`
        w-8 h-8 flex items-center justify-center text-sm font-bold
        border border-gray-600 transition-colors select-none
        ${getCellBackgroundColor(cell, gameStatus)}
        ${getCellTextColor(cell)}
        ${isClickable ? '' : 'cursor-not-allowed'}
      `}
    >
      {getCellContent(cell)}
    </button>
  );
}

// ============================================
// ヘルパー関数
// ============================================

/** セルに表示する内容を取得 */
function getCellContent(cell: CellType): string | number {
  if (cell.state === 'flagged') {
    return CELL_CONTENTS.FLAG;
  }

  if (cell.state === 'revealed') {
    if (cell.isMine) {
      return CELL_CONTENTS.MINE;
    }
    if (cell.neighborMines > 0) {
      return cell.neighborMines;
    }
  }

  return CELL_CONTENTS.EMPTY;
}

/** セルの文字色を取得 */
function getCellTextColor(cell: CellType): string {
  if (cell.state !== 'revealed') {
    return '';
  }

  if (cell.isMine) {
    return 'text-red-600';
  }

  return NEIGHBOR_MINE_COLORS[cell.neighborMines] ?? '';
}

/** セルの背景色を取得 */
function getCellBackgroundColor(cell: CellType, gameStatus: GameStatus): string {
  if (cell.state === 'flagged') {
    return 'bg-yellow-200';
  }

  if (cell.state === 'revealed') {
    if (cell.isMine && gameStatus === 'lost') {
      return 'bg-red-300';
    }
    return 'bg-gray-200';
  }

  // hidden 状態
  return 'bg-gray-400 hover:bg-gray-500';
}
