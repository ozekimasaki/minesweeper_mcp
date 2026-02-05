import { GameEngine } from '@minesweeper-mcp/shared';
import { sessionManager } from '../session/SessionManager';
import * as z from 'zod/v4';

export const newGameTool = {
  name: 'new_game',
  schema: {
    title: 'Start New Game',
    description: 'Start a new minesweeper game. If no difficulty is provided, defaults to advanced level.',
    inputSchema: z.object({
      difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    }),
  },
  handler: async (args: { difficulty?: 'beginner' | 'intermediate' | 'advanced' }, sessionId: string) => {
    const difficulty = args.difficulty ?? 'advanced';
    
    const engine = new GameEngine(difficulty);
    
    sessionManager.createSession(sessionId, engine);
    
    const summary = engine.getSummary();
    
    return {
      content: [{
        type: 'text',
        text: `Started new game (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}: ${summary.rows}×${summary.cols}, ${summary.mines} mines)\nGame ID: ${summary.id}`,
      }],
    };
  },
};
