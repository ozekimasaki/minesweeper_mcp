export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type CellState = 'hidden' | 'revealed' | 'flagged';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface DifficultyConfig {
  rows: number;
  cols: number;
  mines: number;
}

export interface Cell {
  row: number;
  col: number;
  state: CellState;
  isMine: boolean;
  neighborMines: number;
}

export interface GameState {
  id: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  mines: number;
  board: Cell[][];
  status: GameStatus;
  revealedCount: number;
  flaggedCount: number;
}

export interface RevealResult {
  revealed: boolean;
  isMine: boolean;
  neighborMines: number;
  gameStatus: GameStatus;
}

export interface FlagResult {
  flagged: boolean;
  flaggedCount: number;
}

export interface GameSummary {
  id: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  mines: number;
  status: GameStatus;
}
