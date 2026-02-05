"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEngine = void 0;
const constants_1 = require("../constants");
const Cell_1 = require("./Cell");
const utils_1 = require("../utils");
class GameEngine {
    constructor(difficulty) {
        this.status = 'playing';
        this.revealedCount = 0;
        this.flaggedCount = 0;
        this.firstClick = true;
        this.firstClickPosition = null;
        this.id = (0, utils_1.generateUUID)();
        this.difficulty = difficulty;
        const config = constants_1.DIFFICULTY_CONFIGS[difficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mines = config.mines;
        this.board = this.initializeBoard();
    }
    getBoardState() {
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
    getSummary() {
        return {
            id: this.id,
            difficulty: this.difficulty,
            rows: this.rows,
            cols: this.cols,
            mines: this.mines,
            status: this.status,
        };
    }
    reveal(row, col) {
        if (this.status !== 'playing') {
            return {
                revealed: false,
                isMine: false,
                neighborMines: 0,
                gameStatus: this.status,
            };
        }
        const cell = this.getCell(row, col);
        if (!cell || cell.isRevealed() || cell.isFlagged()) {
            return {
                revealed: false,
                isMine: false,
                neighborMines: 0,
                gameStatus: this.status,
            };
        }
        if (this.firstClick) {
            this.firstClick = false;
            this.firstClickPosition = { row, col };
            this.initializeMines(row, col);
            this.calculateNeighborMines();
        }
        const isMine = cell.isMine;
        if (isMine) {
            cell.reveal();
            this.status = 'lost';
            this.revealAllMines();
            return {
                revealed: true,
                isMine: true,
                neighborMines: cell.neighborMines,
                gameStatus: this.status,
            };
        }
        this.revealCellRecursive(row, col);
        this.checkWin();
        return {
            revealed: true,
            isMine: false,
            neighborMines: cell.neighborMines,
            gameStatus: this.status,
        };
    }
    toggleFlag(row, col) {
        if (this.status !== 'playing') {
            return {
                flagged: false,
                flaggedCount: this.flaggedCount,
            };
        }
        const cell = this.getCell(row, col);
        if (!cell || cell.isRevealed()) {
            return {
                flagged: false,
                flaggedCount: this.flaggedCount,
            };
        }
        const flagged = cell.toggleFlag();
        if (flagged) {
            this.flaggedCount++;
        }
        else {
            this.flaggedCount--;
        }
        return {
            flagged,
            flaggedCount: this.flaggedCount,
        };
    }
    reset() {
        this.status = 'playing';
        this.revealedCount = 0;
        this.flaggedCount = 0;
        this.firstClick = true;
        this.firstClickPosition = null;
        this.board = this.initializeBoard();
    }
    initializeBoard() {
        const board = [];
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            for (let c = 0; c < this.cols; c++) {
                row.push(new Cell_1.GameCell(r, c, false));
            }
            board.push(row);
        }
        return board;
    }
    initializeMines(excludeRow, excludeCol) {
        let placedMines = 0;
        const totalCells = this.rows * this.cols;
        while (placedMines < this.mines && placedMines < totalCells - 9) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            const cell = this.getCell(r, c);
            if (cell && !cell.isMine && !this.isNeighborOf(r, c, excludeRow, excludeCol)) {
                cell.isMine = true;
                placedMines++;
            }
        }
    }
    calculateNeighborMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (!this.board[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0)
                                continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            const neighbor = this.getCell(nr, nc);
                            if (neighbor && neighbor.isMine) {
                                count++;
                            }
                        }
                    }
                    this.board[r][c].neighborMines = count;
                }
            }
        }
    }
    revealCellRecursive(row, col) {
        const cell = this.getCell(row, col);
        if (!cell || cell.isRevealed() || cell.isFlagged() || cell.isMine) {
            return;
        }
        cell.reveal();
        this.revealedCount++;
        if (cell.neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0)
                        continue;
                    const nr = row + dr;
                    const nc = col + dc;
                    this.revealCellRecursive(nr, nc);
                }
            }
        }
    }
    checkWin() {
        const nonMineCells = this.rows * this.cols - this.mines;
        if (this.revealedCount === nonMineCells) {
            this.status = 'won';
        }
    }
    revealAllMines() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (cell.isMine && !cell.isRevealed()) {
                    cell.reveal();
                }
            }
        }
    }
    getCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return this.board[row][col];
    }
    isNeighborOf(r1, c1, r2, c2) {
        return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
    }
}
exports.GameEngine = GameEngine;
