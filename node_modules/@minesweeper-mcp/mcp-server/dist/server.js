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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const SessionManager_1 = require("./session/SessionManager");
const revealCell_1 = require("./tools/revealCell");
const flagCell_1 = require("./tools/flagCell");
const newGame_1 = require("./tools/newGame");
const resetGame_1 = require("./tools/resetGame");
const getBoard_1 = require("./tools/getBoard");
const board_1 = require("./resources/board");
const gameInfo_1 = require("./resources/gameInfo");
const MCP_PORT = process.env.MCP_PORT ? Number.parseInt(process.env.MCP_PORT, 10) : 4000;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    exposedHeaders: ['Mcp-Session-Id', 'Last-Event-Id', 'Mcp-Protocol-Version'],
    origin: '*',
}));
const transports = {};
const mcpPostHandler = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    const method = req.body?.method;
    console.log(`MCP POST - SessionID: ${sessionId || 'none'}, Method: ${method || 'none'}`);
    console.log(`Active transports: ${Object.keys(transports).length}`);
    try {
        let transport;
        if (sessionId && transports[sessionId]) {
            console.log(`Using existing transport for session ${sessionId}`);
            transport = transports[sessionId];
        }
        else if (sessionId && !transports[sessionId] && req.body && req.body.method === 'initialize') {
            console.log(`Creating new transport with provided session ID: ${sessionId}`);
            const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
            transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => sessionId,
                onsessioninitialized: (sid) => {
                    console.log(`Session initialized with provided ID: ${sid}`);
                    transports[sid] = transport;
                },
            });
            transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    console.log(`Transport closed for session ${sid}`);
                    delete transports[sid];
                }
            };
            const server = createMcpServer();
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
            return;
        }
        else if (!sessionId && req.body && req.body.method === 'initialize') {
            console.log(`Creating new transport with random session ID`);
            const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
            transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => randomUUID(),
                onsessioninitialized: (sid) => {
                    console.log(`Session initialized with ID: ${sid}`);
                    transports[sid] = transport;
                },
            });
            transport.onclose = () => {
                const sid = transport.sessionId;
                if (sid && transports[sid]) {
                    console.log(`Transport closed for session ${sid}`);
                    delete transports[sid];
                }
            };
            const server = createMcpServer();
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
            return;
        }
        else {
            console.log(`Bad request - SessionID: ${sessionId}, exists: ${!!sessionId && !!transports[sessionId]}, method: ${method}`);
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided',
                },
                id: null,
            });
            return;
        }
        await transport.handleRequest(req, res, req.body);
    }
    catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error',
                },
                id: null,
            });
        }
    }
};
app.post('/mcp', mcpPostHandler);
app.get('/mcp', (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }
    const transport = transports[sessionId];
    transport.handleRequest(req, res);
});
app.delete('/mcp', (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }
    console.log(`Received session termination request for session ${sessionId}`);
    try {
        SessionManager_1.sessionManager.deleteSession(sessionId);
        const transport = transports[sessionId];
        transport.handleRequest(req, res);
    }
    catch (error) {
        console.error('Error handling session termination:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing session termination');
        }
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok', activeSessions: SessionManager_1.sessionManager.getSessionCount() });
});
app.get('/sessions', (req, res) => {
    const sessionIds = Object.keys(transports);
    res.json({ sessions: sessionIds });
});
// REST API for viewing game state (for spectator/viewer mode)
app.get('/game/:sessionId', (req, res) => {
    const sessionId = req.params.sessionId;
    const engine = SessionManager_1.sessionManager.getGameEngine(sessionId);
    if (!engine) {
        res.status(404).json({ error: 'Game not found for this session' });
        return;
    }
    res.json(engine.getBoardState());
});
function createMcpServer() {
    const server = new mcp_js_1.McpServer({
        name: 'minesweeper-mcp-server',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
            resources: {},
        },
    });
    server.registerTool(revealCell_1.revealCellTool.name, revealCell_1.revealCellTool.schema, async (args, ctx) => {
        const sessionId = ctx.sessionId;
        if (!sessionId) {
            throw new Error('No session ID');
        }
        const result = await revealCell_1.revealCellTool.handler(args, sessionId);
        return result;
    });
    server.registerTool(flagCell_1.flagCellTool.name, flagCell_1.flagCellTool.schema, async (args, ctx) => {
        const sessionId = ctx.sessionId;
        if (!sessionId) {
            throw new Error('No session ID');
        }
        const result = await flagCell_1.flagCellTool.handler(args, sessionId);
        return result;
    });
    server.registerTool(newGame_1.newGameTool.name, newGame_1.newGameTool.schema, async (args, ctx) => {
        const sessionId = ctx.sessionId;
        if (!sessionId) {
            throw new Error('No session ID');
        }
        const result = await newGame_1.newGameTool.handler(args, sessionId);
        return result;
    });
    server.registerTool(resetGame_1.resetGameTool.name, resetGame_1.resetGameTool.schema, async (args, ctx) => {
        const sessionId = ctx.sessionId;
        if (!sessionId) {
            throw new Error('No session ID');
        }
        const result = await resetGame_1.resetGameTool.handler(args, sessionId);
        return result;
    });
    server.registerTool(getBoard_1.getBoardTool.name, getBoard_1.getBoardTool.schema, async (args, ctx) => {
        const sessionId = ctx.sessionId;
        if (!sessionId) {
            throw new Error('No session ID');
        }
        const result = await getBoard_1.getBoardTool.handler(args, sessionId);
        return result;
    });
    server.registerResource(board_1.boardResource.name, board_1.boardResource.uriTemplate, board_1.boardResource.schema, async (uri, ctx) => {
        const sessionId = ctx.sessionId;
        if (!sessionId) {
            throw new Error('No session ID');
        }
        const result = await board_1.boardResource.handler(uri, sessionId);
        return result;
    });
    server.registerResource(gameInfo_1.gameInfoResource.name, gameInfo_1.gameInfoResource.uriTemplate, gameInfo_1.gameInfoResource.schema, async (uri, ctx) => {
        const sessionId = ctx.sessionId;
        if (!sessionId) {
            throw new Error('No session ID');
        }
        const result = await gameInfo_1.gameInfoResource.handler(uri, sessionId);
        return result;
    });
    return server;
}
function startServer() {
    SessionManager_1.sessionManager.startCleanupTask();
    app.listen(MCP_PORT, () => {
        console.log(`MCP Server listening on port ${MCP_PORT}`);
        console.log(`Health check: http://localhost:${MCP_PORT}/health`);
    });
}
