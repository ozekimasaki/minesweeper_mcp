"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameCell = void 0;
class GameCell {
    constructor(row, col, isMine) {
        this._state = 'hidden';
        this.neighborMines = 0;
        this.row = row;
        this.col = col;
        this.isMine = isMine;
    }
    get state() {
        return this._state;
    }
    reveal() {
        if (this._state === 'hidden') {
            this._state = 'revealed';
        }
    }
    toggleFlag() {
        if (this._state === 'hidden') {
            this._state = 'flagged';
            return true;
        }
        else if (this._state === 'flagged') {
            this._state = 'hidden';
            return false;
        }
        return false;
    }
    isRevealed() {
        return this._state === 'revealed';
    }
    isFlagged() {
        return this._state === 'flagged';
    }
    isHidden() {
        return this._state === 'hidden';
    }
    toJSON() {
        return {
            row: this.row,
            col: this.col,
            state: this._state,
            isMine: this.isMine,
            neighborMines: this.neighborMines,
        };
    }
}
exports.GameCell = GameCell;
