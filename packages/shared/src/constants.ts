import type { Difficulty, DifficultyConfig } from './game/types';

// ============================================
// 難易度設定
// ============================================

/** 各難易度のボード設定 */
export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  advanced: { rows: 16, cols: 30, mines: 99 },
} as const;

/** 難易度の日本語ラベル */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
} as const;

// ============================================
// ゲームルール定数
// ============================================

/**
 * 最初のクリック時に地雷を配置しない範囲のセル数
 * クリックした位置 + 周囲8セル = 9セル
 */
export const SAFE_ZONE_SIZE = 9;
