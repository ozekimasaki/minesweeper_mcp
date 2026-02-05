import { DIFFICULTY_LABELS, DIFFICULTY_CONFIGS, type Difficulty } from '@minesweeper-mcp/shared';

// ============================================
// 定数
// ============================================

/** 利用可能な難易度リスト */
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

// ============================================
// コンポーネント
// ============================================

interface DifficultySelectorProps {
  currentDifficulty: Difficulty;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onStartGame: (difficulty: Difficulty) => void;
}

/**
 * 難易度選択コンポーネント
 * Windows 95 レトロスタイル
 */
export function DifficultySelector({
  currentDifficulty,
  onSelectDifficulty,
  onStartGame,
}: DifficultySelectorProps) {
  const config = DIFFICULTY_CONFIGS[currentDifficulty];

  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-win95-bg">
      {/* 難易度ボタン */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold">難易度:</span>
        <div className="flex gap-1">
          {DIFFICULTIES.map((diff) => (
            <DifficultyButton
              key={diff}
              difficulty={diff}
              isSelected={currentDifficulty === diff}
              onClick={() => onSelectDifficulty(diff)}
            />
          ))}
        </div>
      </div>

      {/* 難易度詳細 */}
      <DifficultyInfo
        rows={config.rows}
        cols={config.cols}
        mines={config.mines}
      />

      {/* 開始ボタン */}
      <button
        onClick={() => onStartGame(currentDifficulty)}
        className="win95-button px-4 py-1 text-[11px]"
      >
        新しいゲーム
      </button>
    </div>
  );
}

// ============================================
// サブコンポーネント
// ============================================

interface DifficultyButtonProps {
  difficulty: Difficulty;
  isSelected: boolean;
  onClick: () => void;
}

/** 難易度選択ボタン */
function DifficultyButton({ difficulty, isSelected, onClick }: DifficultyButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1 text-[11px]
        transition-none
        ${isSelected 
          ? 'win95-inset bg-white font-bold' 
          : 'win95-button hover:bg-[#d4d4d4]'
        }
      `}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </button>
  );
}

interface DifficultyInfoProps {
  rows: number;
  cols: number;
  mines: number;
}

/** 難易度の詳細情報 */
function DifficultyInfo({ rows, cols, mines }: DifficultyInfoProps) {
  return (
    <div className="text-[11px] text-gray-700">
      <span className="font-bold">{cols}×{rows}</span>
      <span className="mx-2">|</span>
      <span className="font-bold">{mines}</span>
      <span> 地雷</span>
    </div>
  );
}
