import { ReactNode } from 'react';

// ============================================
// 型定義
// ============================================

interface RetroWindowProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

// ============================================
// コンポーネント
// ============================================

/**
 * Windows 95 風のウィンドウコンテナ
 */
export function RetroWindow({
  title,
  children,
  icon,
  className = '',
}: RetroWindowProps) {
  return (
    <div className={`win95-window p-[3px] ${className}`}>
      {/* タイトルバー */}
      <div className="win95-titlebar">
        <div className="flex items-center gap-2">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-white font-bold text-[11px]">{title}</span>
        </div>
      </div>
      
      {/* コンテンツエリア */}
      <div className="bg-win95-bg">
        {children}
      </div>
    </div>
  );
}

// ============================================
// サブコンポーネント
// ============================================

interface RetroStatusBarProps {
  children: ReactNode;
}

/**
 * Windows 95 風のステータスバー
 */
export function RetroStatusBar({ children }: RetroStatusBarProps) {
  return (
    <div className="win95-inset px-2 py-1 text-[11px] mt-1">
      {children}
    </div>
  );
}

interface RetroInsetPanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Windows 95 風の凹型パネル（ステータス表示領域など）
 */
export function RetroInsetPanel({ children, className = '' }: RetroInsetPanelProps) {
  return (
    <div className={`win95-inset p-2 ${className}`}>
      {children}
    </div>
  );
}

interface RetroRaisedPanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Windows 95 風の凸型パネル
 */
export function RetroRaisedPanel({ children, className = '' }: RetroRaisedPanelProps) {
  return (
    <div className={`win95-window p-1 ${className}`}>
      {children}
    </div>
  );
}
