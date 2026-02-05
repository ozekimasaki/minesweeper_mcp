import { useState, useCallback } from 'react';
import type { GameStatus } from '@minesweeper-mcp/shared';

// ============================================
// 型定義
// ============================================

interface FaceButtonProps {
  gameStatus: GameStatus;
  isMouseDown?: boolean;
  onClick: () => void;
}

type FaceState = 'smile' | 'surprised' | 'cool' | 'dead' | 'pressed';

// ============================================
// 顔のピクセルアート定義
// ============================================

// 各顔の表情をピクセルアートとして定義
const FACE_PIXELS: Record<FaceState, string[][]> = {
  // 通常の笑顔 😊
  smile: [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', ''],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y'],
    ['', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'B', 'B', 'B', 'B', 'Y', 'Y', 'Y', 'Y', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ],
  // 驚き顔 😮（セルクリック中）
  surprised: [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', ''],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ],
  // クール顔 😎（勝利時）
  cool: [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', 'Y', 'Y', 'K', 'K', 'K', 'K', 'Y', 'Y', 'K', 'K', 'K', 'K', 'Y', 'Y', ''],
    ['', 'Y', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'K', 'Y', ''],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y'],
    ['', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'B', 'B', 'B', 'B', 'Y', 'Y', 'Y', 'Y', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ],
  // 死亡顔 💀（敗北時）
  dead: [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', 'Y', 'Y', 'B', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'B', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', ''],
    ['Y', 'Y', 'Y', 'B', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'B', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'B', 'B', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'B', 'B', 'B', 'B', 'Y', 'Y', 'Y', 'Y', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ],
  // ボタン押下時
  pressed: [
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'Y', 'Y', 'Y', ''],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y'],
    ['', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'B', 'Y', 'Y', 'Y', ''],
    ['', 'Y', 'Y', 'Y', 'Y', 'B', 'B', 'B', 'B', 'B', 'B', 'Y', 'Y', 'Y', 'Y', ''],
    ['', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', ''],
    ['', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', ''],
    ['', '', '', '', '', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ],
};

// ピクセルの色マッピング
const PIXEL_COLORS: Record<string, string> = {
  Y: '#ffff00', // 黄色（顔）
  B: '#000000', // 黒（目・口）
  K: '#000000', // 黒（サングラス）
  W: '#ffffff', // 白
  R: '#ff0000', // 赤
};

// ============================================
// サブコンポーネント
// ============================================

interface PixelFaceProps {
  state: FaceState;
}

/**
 * ピクセルアートの顔を描画
 */
function PixelFace({ state }: PixelFaceProps) {
  const pixels = FACE_PIXELS[state];
  
  return (
    <svg width="24" height="24" viewBox="0 0 16 16">
      {pixels.map((row, y) =>
        row.map((pixel, x) => {
          if (!pixel) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={PIXEL_COLORS[pixel]}
            />
          );
        })
      )}
    </svg>
  );
}

// ============================================
// メインコンポーネント
// ============================================

/**
 * マインスイーパーの顔ボタン
 * ゲーム状態によって表情が変わる
 */
export function FaceButton({ gameStatus, isMouseDown = false, onClick }: FaceButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  // 現在の顔の状態を決定
  const getFaceState = useCallback((): FaceState => {
    if (isPressed) return 'pressed';
    if (isMouseDown) return 'surprised';
    
    switch (gameStatus) {
      case 'won':
        return 'cool';
      case 'lost':
        return 'dead';
      default:
        return 'smile';
    }
  }, [gameStatus, isMouseDown, isPressed]);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <button
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`
        w-[26px] h-[26px]
        flex items-center justify-center
        bg-win95-bg
        border-none cursor-pointer
        transition-none
        ${isPressed 
          ? 'shadow-win95-pressed pt-[1px] pl-[1px]' 
          : 'shadow-win95-raised'
        }
      `}
      title="クリックして新しいゲームを開始"
    >
      <PixelFace state={getFaceState()} />
    </button>
  );
}

// ============================================
// 絵文字ベースのフォールバック版
// ============================================

interface EmojiFaceButtonProps {
  gameStatus: GameStatus;
  isMouseDown?: boolean;
  onClick: () => void;
}

/**
 * 絵文字ベースの顔ボタン（フォールバック用）
 */
export function EmojiFaceButton({ 
  gameStatus, 
  isMouseDown = false, 
  onClick 
}: EmojiFaceButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const getEmoji = () => {
    if (isPressed) return '😊';
    if (isMouseDown) return '😮';
    
    switch (gameStatus) {
      case 'won':
        return '😎';
      case 'lost':
        return '💀';
      default:
        return '😊';
    }
  };

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        face-button
        ${isPressed ? 'shadow-win95-pressed' : ''}
      `}
      title="クリックして新しいゲームを開始"
    >
      {getEmoji()}
    </button>
  );
}
