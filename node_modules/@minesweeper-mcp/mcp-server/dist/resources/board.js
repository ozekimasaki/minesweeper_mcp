"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boardResource = void 0;
const SessionManager_1 = require("../session/SessionManager");
exports.boardResource = {
    name: 'board',
    uriTemplate: 'board://current',
    schema: {
        title: 'Current Game Board',
        description: 'The current state of the game board',
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
        const state = engine.getBoardState();
        return {
            contents: [{
                    uri: uri.href,
                    text: JSON.stringify(state, null, 2),
                }],
        };
    },
};
