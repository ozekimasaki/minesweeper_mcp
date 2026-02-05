import type { GameState, Difficulty, RevealResult, FlagResult, GameSummary } from './types';
export declare class GameEngine {
    private id;
    private difficulty;
    private rows;
    private cols;
    private mines;
    private board;
    private status;
    private revealedCount;
    private flaggedCount;
    private firstClick;
    private firstClickPosition;
    constructor(difficulty: Difficulty);
    getBoardState(): GameState;
    getSummary(): GameSummary;
    reveal(row: number, col: number): RevealResult;
    toggleFlag(row: number, col: number): FlagResult;
    reset(): void;
    private initializeBoard;
    private initializeMines;
    private calculateNeighborMines;
    private revealCellRecursive;
    private checkWin;
    private revealAllMines;
    private getCell;
    private isNeighborOf;
}
