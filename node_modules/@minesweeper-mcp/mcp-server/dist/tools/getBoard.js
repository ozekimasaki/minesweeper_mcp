"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardTool = void 0;
const SessionManager_1 = require("../session/SessionManager");
const z = __importStar(require("zod/v4"));
/**
 * Builds detailed JSON response with analysis hints for AI
 */
function buildBoardResponse(board, state) {
    const hiddenCells = [];
    const flaggedCells = [];
    const revealedCells = [];
    const numberCells = [];
    // First pass: categorize all cells
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = board[row][col];
            if (cell.state === 'flagged') {
                flaggedCells.push({ row, col });
            }
            else if (cell.state === 'hidden') {
                hiddenCells.push({ row, col });
            }
            else {
                // revealed
                const neighborMines = cell.neighborMines || 0;
                revealedCells.push({ row, col, neighborMines });
                if (neighborMines > 0) {
                    numberCells.push({ row, col, neighborMines });
                }
            }
        }
    }
    // Second pass: build analysis hints for number cells
    const analysisHints = [];
    for (const numCell of numberCells) {
        const adjacentHidden = [];
        let adjacentFlagged = 0;
        // Check all 8 neighbors
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0)
                    continue;
                const nr = numCell.row + dr;
                const nc = numCell.col + dc;
                // Bounds check
                if (nr < 0 || nr >= board.length || nc < 0 || nc >= board[0].length)
                    continue;
                const neighbor = board[nr][nc];
                if (neighbor.state === 'hidden') {
                    adjacentHidden.push({ row: nr, col: nc });
                }
                else if (neighbor.state === 'flagged') {
                    adjacentFlagged++;
                }
            }
        }
        // Only include hints where there are hidden neighbors (actionable cells)
        if (adjacentHidden.length > 0) {
            analysisHints.push({
                cell: numCell,
                adjacentHidden,
                adjacentFlagged,
                remainingMines: numCell.neighborMines - adjacentFlagged,
            });
        }
    }
    return {
        gameInfo: {
            difficulty: state.difficulty,
            rows: state.rows,
            cols: state.cols,
            totalMines: state.mines,
            flagsPlaced: state.flaggedCount,
            status: state.status,
        },
        hiddenCells,
        flaggedCells,
        revealedCells,
        analysisHints,
    };
}
exports.getBoardTool = {
    name: 'get_board',
    schema: {
        title: 'Get Board',
        description: `Get the current game board state in JSON format with detailed analysis hints.

Returns:
- gameInfo: Game metadata (difficulty, size, mines, status)
- hiddenCells: List of unrevealed cell coordinates [{row, col}]
- flaggedCells: List of flagged cell coordinates [{row, col}]
- revealedCells: List of revealed cells with their neighbor mine counts [{row, col, neighborMines}]
- analysisHints: For each number cell, shows adjacent hidden cells and remaining unflagged mines
  - Use this to determine safe moves (remainingMines=0 means all adjacent hidden are safe)
  - Or to place flags (adjacentHidden.length = remainingMines means all hidden are mines)

Coordinates are 0-based (row 0 is top, col 0 is left).`,
        inputSchema: z.object({}),
    },
    handler: async (_args, sessionId) => {
        const engine = SessionManager_1.sessionManager.getGameEngine(sessionId);
        if (!engine) {
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ error: 'No active game. Use new_game to start.' }),
                    }],
            };
        }
        const state = engine.getBoardState();
        const response = buildBoardResponse(state.board, state);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(response, null, 2),
                }],
        };
    },
};
