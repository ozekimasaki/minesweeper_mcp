"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameInfoResource = void 0;
const SessionManager_1 = require("../session/SessionManager");
exports.gameInfoResource = {
    name: 'game_info',
    uriTemplate: 'game://info',
    schema: {
        title: 'Game Info',
        description: 'Current game information and statistics',
        mimeType: 'application/json',
    },
    handler: async (uri, sessionId) => {
        const engine = SessionManager_1.sessionManager.getGameEngine(sessionId);
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
