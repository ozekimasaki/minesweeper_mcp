import type { Cell, GameState, GameStatus, Difficulty, RevealResult, FlagResult, GameSummary } from './types';
import { DIFFICULTY_CONFIGS, SAFE_ZONE_SIZE } from '../constants';
import { GameCell } from './Cell';
import { generateUUID } from '../utils';

/** 座標を表す型 */
interface Position {
  row: number;
  col: number;
}

/**
 * マインスイーパーのゲームロジックを管理するエンジン
 */
export class GameEngine {
  private readonly id: string;
  private readonly difficulty: Difficulty;
  private readonly rows: number;
  private readonly cols: number;
  private readonly mines: number;
  private board: GameCell[][];
  private status: GameStatus = 'playing';
  private revealedCount: number = 0;
  private flaggedCount: number = 0;
  private isFirstClick: boolean = true;

  constructor(difficulty: Difficulty) {
    this.id = generateUUID();
    this.difficulty = difficulty;

    const config = DIFFICULTY_CONFIGS[difficulty];
    this.rows = config.rows;
    this.cols = config.cols;
    this.mines = config.mines;

    this.board = this.createEmptyBoard();
  }

  /** 現在のゲーム状態を取得 */
  getBoardState(): GameState {
    return {
      id: this.id,
      difficulty: this.difficulty,
      rows: this.rows,
      cols: this.cols,
      mines: this.mines,
      board: this.board.map(row => row.map(cell => cell.toJSON())),
      status: this.status,
      revealedCount: this.revealedCount,
      flaggedCount: this.flaggedCount,
    };
  }

  /** ゲームのサマリー情報を取得 */
  getSummary(): GameSummary {
    return {
      id: this.id,
      difficulty: this.difficulty,
      rows: this.rows,
      cols: this.cols,
      mines: this.mines,
      status: this.status,
    };
  }

  /**
   * 指定されたセルを開く
   * @param row 行インデックス
   * @param col 列インデックス
   * @returns 開いた結果
   */
  reveal(row: number, col: number): RevealResult {
    // ゲームが終了している場合は何もしない
    if (this.status !== 'playing') {
      return this.createRevealResult(false, false, 0);
    }

    const cell = this.getCell(row, col);
    if (!cell || cell.isRevealed() || cell.isFlagged()) {
      return this.createRevealResult(false, false, 0);
    }

    // 最初のクリック時に地雷を配置
    if (this.isFirstClick) {
      this.isFirstClick = false;
      this.placeMines({ row, col });
      this.calculateAllNeighborMines();
    }

    // 地雷を踏んだ場合
    if (cell.isMine) {
      cell.reveal();
      this.status = 'lost';
      this.revealAllMines();
      return this.createRevealResult(true, true, cell.neighborMines);
    }

    // 安全なセルを開く
    this.revealCellRecursively(row, col);
    this.checkWinCondition();

    return this.createRevealResult(true, false, cell.neighborMines);
  }

  /**
   * 指定されたセルのフラグを切り替える
   * @param row 行インデックス
   * @param col 列インデックス
   * @returns フラグ操作の結果
   */
  toggleFlag(row: number, col: number): FlagResult {
    if (this.status !== 'playing') {
      return { flagged: false, flaggedCount: this.flaggedCount };
    }

    const cell = this.getCell(row, col);
    if (!cell || cell.isRevealed()) {
      return { flagged: false, flaggedCount: this.flaggedCount };
    }

    const isFlagged = cell.toggleFlag();
    this.flaggedCount += isFlagged ? 1 : -1;

    return { flagged: isFlagged, flaggedCount: this.flaggedCount };
  }

  /** ゲームをリセット（同じ難易度で新しいゲームを開始） */
  reset(): void {
    this.status = 'playing';
    this.revealedCount = 0;
    this.flaggedCount = 0;
    this.isFirstClick = true;
    this.board = this.createEmptyBoard();
  }

  // ============================================
  // Private Methods - 初期化系
  // ============================================

  /** 空のボードを作成 */
  private createEmptyBoard(): GameCell[][] {
    return Array.from({ length: this.rows }, (_, row) =>
      Array.from({ length: this.cols }, (_, col) => new GameCell(row, col))
    );
  }

  /**
   * 地雷を配置する
   * @param safePosition 最初にクリックされた位置（この周囲には地雷を配置しない）
   */
  private placeMines(safePosition: Position): void {
    const totalCells = this.rows * this.cols;
    const maxMines = totalCells - SAFE_ZONE_SIZE;
    const minesToPlace = Math.min(this.mines, maxMines);

    let placedMines = 0;
    while (placedMines < minesToPlace) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);

      const cell = this.getCell(row, col);
      const isInSafeZone = this.isWithinDistance({ row, col }, safePosition, 1);

      if (cell && !cell.isMine && !isInSafeZone) {
        cell.setMine();
        placedMines++;
      }
    }
  }

  /** すべてのセルの周囲地雷数を計算 */
  private calculateAllNeighborMines(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.board[row][col];
        if (!cell.isMine) {
          cell.neighborMines = this.countNeighborMines(row, col);
        }
      }
    }
  }

  // ============================================
  // Private Methods - ゲームロジック系
  // ============================================

  /**
   * セルを再帰的に開く
   * 周囲に地雷がないセルの場合、隣接セルも自動的に開く
   */
  private revealCellRecursively(row: number, col: number): void {
    const cell = this.getCell(row, col);
    if (!cell || cell.isRevealed() || cell.isFlagged() || cell.isMine) {
      return;
    }

    cell.reveal();
    this.revealedCount++;

    // 周囲に地雷がない場合、隣接セルも開く
    if (cell.neighborMines === 0) {
      for (const neighbor of this.getNeighborPositions(row, col)) {
        this.revealCellRecursively(neighbor.row, neighbor.col);
      }
    }
  }

  /** 勝利条件をチェック */
  private checkWinCondition(): void {
    const nonMineCells = this.rows * this.cols - this.mines;
    if (this.revealedCount === nonMineCells) {
      this.status = 'won';
    }
  }

  /** すべての地雷を表示（ゲーム終了時） */
  private revealAllMines(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.board[row][col];
        if (cell.isMine && !cell.isRevealed()) {
          cell.reveal();
        }
      }
    }
  }

  // ============================================
  // Private Methods - ユーティリティ系
  // ============================================

  /**
   * 指定された位置のセルを取得
   * @returns セルが存在しない場合は null
   */
  private getCell(row: number, col: number): GameCell | null {
    if (!this.isValidPosition(row, col)) {
      return null;
    }
    return this.board[row][col];
  }

  /** 位置がボード内かどうかを判定 */
  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  /**
   * 2つの位置が指定された距離以内かどうかを判定
   * @param pos1 位置1
   * @param pos2 位置2
   * @param distance 許容距離（チェビシェフ距離）
   */
  private isWithinDistance(pos1: Position, pos2: Position, distance: number): boolean {
    return Math.abs(pos1.row - pos2.row) <= distance && Math.abs(pos1.col - pos2.col) <= distance;
  }

  /**
   * 指定された位置の隣接セルの座標リストを取得
   * @returns 有効な隣接セルの座標配列
   */
  private getNeighborPositions(row: number, col: number): Position[] {
    const neighbors: Position[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const newRow = row + dr;
        const newCol = col + dc;
        if (this.isValidPosition(newRow, newCol)) {
          neighbors.push({ row: newRow, col: newCol });
        }
      }
    }
    return neighbors;
  }

  /** 指定された位置の周囲にある地雷の数を数える */
  private countNeighborMines(row: number, col: number): number {
    return this.getNeighborPositions(row, col)
      .filter(pos => this.board[pos.row][pos.col].isMine)
      .length;
  }

  /** RevealResult オブジェクトを作成 */
  private createRevealResult(revealed: boolean, isMine: boolean, neighborMines: number): RevealResult {
    return {
      revealed,
      isMine,
      neighborMines,
      gameStatus: this.status,
    };
  }
}
