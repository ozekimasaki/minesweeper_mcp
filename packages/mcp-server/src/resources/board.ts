import { sessionManager } from '../session/SessionManager';
import * as z from 'zod/v4';

export const boardResource = {
  name: 'board',
  uriTemplate: 'board://current' as string,
  schema: {
    title: 'Current Game Board',
    description: 'The current state of the game board',
    mimeType: 'application/json',
  },
  handler: async (uri: URL, sessionId: string) => {
    const engine = sessionManager.getGameEngine(sessionId);
    if (!engine) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: 'No active game session' }),
        }],
      };
    }

    const state = engine.getBoardState();

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(state, null, 2),
      }],
    };
  },
};
