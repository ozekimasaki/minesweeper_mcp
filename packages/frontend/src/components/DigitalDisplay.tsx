import { useMemo } from 'react';

// ============================================
// 型定義
// ============================================

interface DigitalDisplayProps {
  value: number;
  digits?: number;
  className?: string;
}

// ============================================
// セブンセグメントの各部分のパス定義
// ============================================

// 各セグメントの形状（SVG path）
const SEGMENTS = {
  // 上横棒
  a: 'M 2 0 L 10 0 L 9 1 L 3 1 Z',
  // 右上縦棒
  b: 'M 10 0 L 10 8 L 9 7 L 9 1 Z',
  // 右下縦棒
  c: 'M 10 8 L 10 16 L 9 15 L 9 9 Z',
  // 下横棒
  d: 'M 2 16 L 10 16 L 9 15 L 3 15 Z',
  // 左下縦棒
  e: 'M 2 8 L 2 16 L 3 15 L 3 9 Z',
  // 左上縦棒
  f: 'M 2 0 L 2 8 L 3 7 L 3 1 Z',
  // 中央横棒
  g: 'M 2 8 L 10 8 L 9 9 L 3 9 L 3 7 L 9 7 L 10 8 L 2 8 Z',
};

// 数字ごとに点灯するセグメント
const DIGIT_SEGMENTS: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
  '-': ['g'],
  ' ': [],
};

// ============================================
// サブコンポーネント
// ============================================

interface DigitProps {
  char: string;
}

/**
 * 単一の7セグメント数字
 */
function Digit({ char }: DigitProps) {
  const activeSegments = DIGIT_SEGMENTS[char] || [];
  
  return (
    <svg 
      width="14" 
      height="20" 
      viewBox="0 0 12 18" 
      className="inline-block"
    >
      {Object.entries(SEGMENTS).map(([segment, path]) => (
        <path
          key={segment}
          d={path}
          fill={activeSegments.includes(segment) ? '#ff0000' : '#400000'}
          style={{
            filter: activeSegments.includes(segment) 
              ? 'drop-shadow(0 0 2px #ff0000)' 
              : 'none',
          }}
        />
      ))}
    </svg>
  );
}

// ============================================
// メインコンポーネント
// ============================================

/**
 * セブンセグメント風LED表示
 * マインスイーパーの地雷カウンターやタイマー表示に使用
 */
export function DigitalDisplay({ 
  value, 
  digits = 3, 
  className = '' 
}: DigitalDisplayProps) {
  // 表示文字列を生成（負の値対応、桁数制限）
  const displayString = useMemo(() => {
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const maxValue = Math.pow(10, isNegative ? digits - 1 : digits) - 1;
    const clampedValue = Math.min(absValue, maxValue);
    
    let str = clampedValue.toString();
    
    // 桁数に合わせてパディング
    if (isNegative) {
      str = str.padStart(digits - 1, '0');
      str = '-' + str;
    } else {
      str = str.padStart(digits, '0');
    }
    
    // 最大桁数を超えないように
    return str.slice(-digits);
  }, [value, digits]);

  return (
    <div 
      className={`
        inline-flex items-center justify-center
        bg-[#300000] px-1 py-[2px]
        border-t-2 border-l-2 border-[#808080]
        border-b-2 border-r-2 border-[#ffffff]
        ${className}
      `}
      style={{
        boxShadow: 'inset 1px 1px 0 #404040',
      }}
    >
      {displayString.split('').map((char, index) => (
        <Digit key={index} char={char} />
      ))}
    </div>
  );
}

// ============================================
// 代替: シンプルなテキストベースのLED表示
// ============================================

interface SimpleLedDisplayProps {
  value: number;
  digits?: number;
  className?: string;
}

/**
 * シンプルなテキストベースのLED表示（フォールバック用）
 */
export function SimpleLedDisplay({ 
  value, 
  digits = 3, 
  className = '' 
}: SimpleLedDisplayProps) {
  const displayValue = useMemo(() => {
    const maxValue = Math.pow(10, digits) - 1;
    const minValue = -Math.pow(10, digits - 1) + 1;
    const clamped = Math.max(minValue, Math.min(maxValue, value));
    
    if (clamped < 0) {
      return '-' + Math.abs(clamped).toString().padStart(digits - 1, '0');
    }
    return clamped.toString().padStart(digits, '0');
  }, [value, digits]);

  return (
    <div 
      className={`
        led-display
        text-lg font-mono font-bold tracking-widest
        ${className}
      `}
    >
      <span className="led-digit">{displayValue}</span>
    </div>
  );
}
