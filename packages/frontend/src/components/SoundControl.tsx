// ============================================
// サウンドコントロールコンポーネント
// ============================================

interface SoundControlProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * サウンド有効/無効切り替えボタン
 */
export function SoundControl({ isEnabled, onToggle }: SoundControlProps) {
  return (
    <button
      onClick={() => onToggle(!isEnabled)}
      className="win95-button px-2 py-1 text-xs flex items-center gap-1"
      title={isEnabled ? 'サウンドをオフにする' : 'サウンドをオンにする'}
    >
      <span>{isEnabled ? '🔊' : '🔇'}</span>
      <span className="hidden sm:inline">
        {isEnabled ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
