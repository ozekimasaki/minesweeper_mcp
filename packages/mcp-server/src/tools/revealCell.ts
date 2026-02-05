import { sessionManager } from '../session/SessionManager';
import * as z from 'zod/v4';

export const revealCellTool = {
  name: 'reveal_cell',
  schema: {
    title: 'Reveal Cell',
    description: 'Reveal a cell at the specified position',
    inputSchema: z.object({
      row: z.number().describe('Row index (0-based)'),
      col: z.number().describe('Column index (0-based)'),
    }),
  },
  handler: async ({ row, col }: { row: number; col: number }, sessionId: string) => {
    const engine = sessionManager.getGameEngine(sessionId);
    if (!engine) {
      return {
        content: [{
          type: 'text',
          text: 'No active game session. Please start a new game first.',
        }],
      };
    }

    const result = engine.reveal(row, col);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result),
      }],
    };
  },
};
