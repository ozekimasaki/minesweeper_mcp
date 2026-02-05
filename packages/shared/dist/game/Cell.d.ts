import type { Cell, CellState } from './types';
export declare class GameCell implements Cell {
    readonly row: number;
    readonly col: number;
    private _state;
    readonly isMine: boolean;
    neighborMines: number;
    constructor(row: number, col: number, isMine: boolean);
    get state(): CellState;
    reveal(): void;
    toggleFlag(): boolean;
    isRevealed(): boolean;
    isFlagged(): boolean;
    isHidden(): boolean;
    toJSON(): Cell;
}
