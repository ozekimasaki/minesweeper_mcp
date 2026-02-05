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
exports.newGameTool = void 0;
const shared_1 = require("@minesweeper-mcp/shared");
const SessionManager_1 = require("../session/SessionManager");
const z = __importStar(require("zod/v4"));
exports.newGameTool = {
    name: 'new_game',
    schema: {
        title: 'Start New Game',
        description: 'Start a new minesweeper game. If no difficulty is provided, defaults to advanced level.',
        inputSchema: z.object({
            difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        }),
    },
    handler: async (args, sessionId) => {
        const difficulty = args.difficulty ?? 'advanced';
        const engine = new shared_1.GameEngine(difficulty);
        SessionManager_1.sessionManager.createSession(sessionId, engine);
        const summary = engine.getSummary();
        return {
            content: [{
                    type: 'text',
                    text: `Started new game (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}: ${summary.rows}×${summary.cols}, ${summary.mines} mines)\nGame ID: ${summary.id}`,
                }],
        };
    },
};
