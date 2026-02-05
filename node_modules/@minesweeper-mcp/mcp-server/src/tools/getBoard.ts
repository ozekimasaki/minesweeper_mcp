import { sessionManager } from '../session/SessionManager';
import * as z from 'zod/v4';

interface CellInfo {
  row: number;
  col: number;
  state: 'hidden' | 'revealed' | 'flagged';
  neighborMines?: number;  // 公開されたセルのみ
}

interface BoardResponse {
  gameInfo: {
    difficulty: string;
    rows: number;
    cols: number;
    totalMines: number;
    flagsPlaced: number;
    status: 'playing' | 'won' | 'lost';
  };
  // 隠れているセル（まだ開けていないセル）の座標リスト
  hiddenCells: Array<{ row: number; col: number }>;
  // フラグが立っているセルの座標リスト
  flaggedCells: Array<{ row: number; col: number }>;
  // 公開済みセルの詳細情報（座標と周囲の地雷数）
  revealedCells: Array<{ row: number; col: number; neighborMines: number }>;
  // 分析のヒント：数字セルの周囲にある未公開セルの情報
  analysisHints: Array<{
    cell: { row: number; col: number; neighborMines: number };
    adjacentHidden: Array<{ row: number; col: number }>;
    adjacentFlagged: number;
    remainingMines: number;  // neighborMines - adjacentFlagged
  }>;
}

/**
 * Builds detailed JSON response with analysis hints for AI
 */
function buildBoardResponse(board: any[][], state: any): BoardResponse {
  const hiddenCells: Array<{ row: number; col: number }> = [];
  const flaggedCells: Array<{ row: number; col: number }> = [];
  const revealedCells: Array<{ row: number; col: number; neighborMines: number }> = [];
  const numberCells: Array<{ row: number; col: number; neighborMines: number }> = [];

  // First pass: categorize all cells
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      
      if (cell.state === 'flagged') {
        flaggedCells.push({ row, col });
      } else if (cell.state === 'hidden') {
        hiddenCells.push({ row, col });
      } else {
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
  const analysisHints: BoardResponse['analysisHints'] = [];
  
  for (const numCell of numberCells) {
    const adjacentHidden: Array<{ row: number; col: number }> = [];
    let adjacentFlagged = 0;

    // Check all 8 neighbors
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        
        const nr = numCell.row + dr;
        const nc = numCell.col + dc;
        
        // Bounds check
        if (nr < 0 || nr >= board.length || nc < 0 || nc >= board[0].length) continue;
        
        const neighbor = board[nr][nc];
        if (neighbor.state === 'hidden') {
          adjacentHidden.push({ row: nr, col: nc });
        } else if (neighbor.state === 'flagged') {
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

export const getBoardTool = {
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
  handler: async (_args: Record<string, never>, sessionId: string) => {
    const engine = sessionManager.getGameEngine(sessionId);
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
