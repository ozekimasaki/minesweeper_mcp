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
 */
export function DifficultySelector({
  currentDifficulty,
  onSelectDifficulty,
  onStartGame,
}: DifficultySelectorProps) {
  const config = DIFFICULTY_CONFIGS[currentDifficulty];

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-100 rounded-lg">
      {/* 難易度ボタン */}
      <div className="flex items-center gap-4">
        <span className="font-semibold">難易度:</span>
        <div className="flex gap-2">
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
        className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors"
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
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const selectedClasses = isSelected
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-white text-gray-800 hover:bg-gray-50';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${selectedClasses}`}
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
    <div className="text-sm text-gray-600">
      <span className="font-semibold">{rows}×{cols}</span>
      <span className="mx-2">|</span>
      <span className="font-semibold">{mines}地雷</span>
    </div>
  );
}
