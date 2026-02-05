import { sessionManager } from '../session/SessionManager';
import * as z from 'zod/v4';

export const resetGameTool = {
  name: 'reset_game',
  schema: {
    title: 'Reset Game',
    description: 'Reset the current game with the same difficulty',
    inputSchema: z.object({}),
  },
  handler: async (_args: unknown, sessionId: string) => {
    const engine = sessionManager.getGameEngine(sessionId);
    if (!engine) {
      return {
        content: [{
          type: 'text',
          text: 'No active game session. Please start a new game first.',
        }],
      };
    }

    engine.reset();

    const summary = engine.getSummary();

    return {
      content: [{
        type: 'text',
        text: `Game reset. Game ID: ${summary.id}`,
      }],
    };
  },
};
