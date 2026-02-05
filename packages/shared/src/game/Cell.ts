import type { Cell, CellState } from './types';

/**
 * ゲーム内の1つのセルを表すクラス
 * セルの状態（hidden/revealed/flagged）と地雷情報を管理する
 */
export class GameCell implements Cell {
  readonly row: number;
  readonly col: number;
  private _state: CellState = 'hidden';
  private _isMine: boolean;
  neighborMines: number = 0;

  constructor(row: number, col: number, isMine: boolean = false) {
    this.row = row;
    this.col = col;
    this._isMine = isMine;
  }

  /** セルが地雷かどうか */
  get isMine(): boolean {
    return this._isMine;
  }

  /** セルの現在の状態 */
  get state(): CellState {
    return this._state;
  }

  /**
   * セルを地雷として設定する
   * ゲーム初期化時に地雷を配置するために使用
   */
  setMine(): void {
    this._isMine = true;
  }

  /**
   * セルを開く
   * hidden 状態の場合のみ revealed に変更
   */
  reveal(): void {
    if (this._state === 'hidden') {
      this._state = 'revealed';
    }
  }

  /**
   * フラグの状態を切り替える
   * @returns フラグが立てられた場合は true、外された場合は false
   */
  toggleFlag(): boolean {
    if (this._state === 'hidden') {
      this._state = 'flagged';
      return true;
    }
    if (this._state === 'flagged') {
      this._state = 'hidden';
      return false;
    }
    return false;
  }

  /** セルが開かれているか */
  isRevealed(): boolean {
    return this._state === 'revealed';
  }

  /** セルにフラグが立っているか */
  isFlagged(): boolean {
    return this._state === 'flagged';
  }

  /** セルが隠されているか */
  isHidden(): boolean {
    return this._state === 'hidden';
  }

  /** セルをシリアライズ可能なオブジェクトに変換 */
  toJSON(): Cell {
    return {
      row: this.row,
      col: this.col,
      state: this._state,
      isMine: this._isMine,
      neighborMines: this.neighborMines,
    };
  }
}
