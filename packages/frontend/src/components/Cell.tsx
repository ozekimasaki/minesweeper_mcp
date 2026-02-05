import { useState, useCallback, useMemo } from 'react';
import type { Cell as CellType, GameStatus } from '@minesweeper-mcp/shared';

// ============================================
// 定数定義
// ============================================

/** 周囲の地雷数に対応する文字色（クラシックマインスイーパー準拠） */
const NEIGHBOR_MINE_COLORS: Record<number, string> = {
  1: 'text-[#0000ff]',  // 青
  2: 'text-[#008000]',  // 緑
  3: 'text-[#ff0000]',  // 赤
  4: 'text-[#000080]',  // 紺
  5: 'text-[#800000]',  // 茶
  6: 'text-[#008080]',  // ティール
  7: 'text-[#000000]',  // 黒
  8: 'text-[#808080]',  // グレー
} as const;

// ============================================
// アイコンコンポーネント
// ============================================

/** 地雷アイコン（ピクセルアート風SVG） */
function MineIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" className="inline-block">
      {/* 地雷本体（円） */}
      <circle cx="8" cy="8" r="5" fill="#000000" />
      {/* スパイク（十字） */}
      <rect x="7" y="1" width="2" height="14" fill="#000000" />
      <rect x="1" y="7" width="14" height="2" fill="#000000" />
      {/* スパイク（斜め） */}
      <rect x="7" y="1" width="2" height="14" fill="#000000" transform="rotate(45 8 8)" />
      <rect x="7" y="1" width="2" height="14" fill="#000000" transform="rotate(-45 8 8)" />
      {/* ハイライト */}
      <circle cx="6" cy="6" r="1.5" fill="#ffffff" />
    </svg>
  );
}

/** フラグアイコン（ピクセルアート風SVG） */
function FlagIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 16" className="inline-block">
      {/* 旗部分（赤い三角） */}
      <polygon points="2,1 10,5 2,9" fill="#ff0000" />
      {/* ポール */}
      <rect x="1" y="1" width="2" height="12" fill="#000000" />
      {/* 土台 */}
      <rect x="0" y="13" width="12" height="2" fill="#000000" />
    </svg>
  );
}

/** 間違ったフラグアイコン（×マーク付き） */
function WrongFlagIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 16" className="inline-block">
      {/* フラグ */}
      <polygon points="2,1 10,5 2,9" fill="#ff0000" opacity="0.5" />
      <rect x="1" y="1" width="2" height="12" fill="#000000" opacity="0.5" />
      <rect x="0" y="13" width="12" height="2" fill="#000000" />
      {/* ×マーク */}
      <line x1="1" y1="1" x2="11" y2="11" stroke="#ff0000" strokeWidth="2" />
      <line x1="11" y1="1" x2="1" y2="11" stroke="#ff0000" strokeWidth="2" />
    </svg>
  );
}

// ============================================
// コンポーネント
// ============================================

interface CellProps {
  cell: CellType;
  gameStatus: GameStatus;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  isRevealing?: boolean;
  isExploding?: boolean;
}

/**
 * マインスイーパーの個々のセルを表示するコンポーネント
 * Windows 95 クラシックスタイル
 */
export function Cell({ 
  cell, 
  gameStatus, 
  onClick, 
  onRightClick,
  onMouseDown,
  onMouseUp,
  isRevealing = false,
  isExploding = false,
}: CellProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const isGameOver = gameStatus !== 'playing';
  const isClickable = cell.state !== 'revealed' && !isGameOver;

  // マウスイベントハンドラー
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && isClickable) { // 左クリックのみ
      setIsPressed(true);
      onMouseDown?.();
    }
  }, [isClickable, onMouseDown]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    onMouseUp?.();
  }, [onMouseUp]);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  // セルのスタイルを計算
  const cellStyle = useMemo(() => {
    const baseStyle = `
      w-[20px] h-[20px] 
      flex items-center justify-center 
      text-xs font-bold
      border-none
      transition-none
      select-none
    `;

    // アニメーションクラス
    let animationClass = '';
    if (isRevealing) {
      animationClass = 'animate-reveal';
    } else if (isExploding) {
      animationClass = 'animate-explode';
    }

    // 状態に応じたスタイル
    if (cell.state === 'revealed') {
      // 開封済みセル
      const isMineExploded = cell.isMine && gameStatus === 'lost';
      return `${baseStyle} ${animationClass} cell-revealed ${isMineExploded ? 'bg-red-500' : ''}`;
    }

    if (cell.state === 'flagged') {
      // フラグ付きセル
      return `${baseStyle} ${animationClass} cell-flagged`;
    }

    // 未開封セル
    if (isPressed) {
      return `${baseStyle} cell-revealed`; // 押下中は開封済みの見た目
    }
    
    return `${baseStyle} cell-hidden ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;
  }, [cell.state, cell.isMine, gameStatus, isPressed, isClickable, isRevealing, isExploding]);

  // セルの内容を取得
  const cellContent = useMemo(() => {
    // フラグ状態
    if (cell.state === 'flagged') {
      // ゲームオーバー時に間違ったフラグを表示
      if (gameStatus === 'lost' && !cell.isMine) {
        return <WrongFlagIcon />;
      }
      return <FlagIcon />;
    }

    // 開封済み
    if (cell.state === 'revealed') {
      if (cell.isMine) {
        return <MineIcon />;
      }
      if (cell.neighborMines > 0) {
        return (
          <span className={NEIGHBOR_MINE_COLORS[cell.neighborMines]}>
            {cell.neighborMines}
          </span>
        );
      }
    }

    // ゲームオーバー時に隠れている地雷を表示
    if (gameStatus === 'lost' && cell.state === 'hidden' && cell.isMine) {
      return <MineIcon />;
    }

    return null;
  }, [cell, gameStatus]);

  return (
    <button
      onClick={onClick}
      onContextMenu={onRightClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      disabled={!isClickable}
      className={cellStyle}
      aria-label={getAriaLabel(cell, gameStatus)}
    >
      {cellContent}
    </button>
  );
}

// ============================================
// ヘルパー関数
// ============================================

/** アクセシビリティ用のラベルを生成 */
function getAriaLabel(cell: CellType, gameStatus: GameStatus): string {
  if (cell.state === 'flagged') {
    return 'フラグ付きセル';
  }
  
  if (cell.state === 'revealed') {
    if (cell.isMine) {
      return '地雷';
    }
    if (cell.neighborMines > 0) {
      return `周囲の地雷数: ${cell.neighborMines}`;
    }
    return '空のセル';
  }
  
  if (gameStatus !== 'playing') {
    return '未開封セル';
  }
  
  return '未開封セル - クリックで開く';
}
