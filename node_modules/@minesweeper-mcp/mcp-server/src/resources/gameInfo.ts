import { sessionManager } from '../session/SessionManager';
import * as z from 'zod/v4';

export const gameInfoResource = {
  name: 'game_info',
  uriTemplate: 'game://info' as string,
  schema: {
    title: 'Game Info',
    description: 'Current game information and statistics',
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

    const summary = engine.getSummary();

    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(summary, null, 2),
      }],
    };
  },
};
