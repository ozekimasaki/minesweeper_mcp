import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { sessionManager } from './session/SessionManager';
import { revealCellTool } from './tools/revealCell';
import { flagCellTool } from './tools/flagCell';
import { newGameTool } from './tools/newGame';
import { resetGameTool } from './tools/resetGame';
import { getBoardTool } from './tools/getBoard';
import { boardResource } from './resources/board';
import { gameInfoResource } from './resources/gameInfo';

const MCP_PORT = process.env.MCP_PORT ? Number.parseInt(process.env.MCP_PORT, 10) : 4000;

const app = express();

app.use(express.json());

app.use(cors({
  exposedHeaders: ['Mcp-Session-Id', 'Last-Event-Id', 'Mcp-Protocol-Version'],
  origin: '*',
}));

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const mcpPostHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const method = req.body?.method;

  console.log(`MCP POST - SessionID: ${sessionId || 'none'}, Method: ${method || 'none'}`);
  console.log(`Active transports: ${Object.keys(transports).length}`);

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      console.log(`Using existing transport for session ${sessionId}`);
      transport = transports[sessionId];
    } else if (sessionId && !transports[sessionId] && req.body && req.body.method === 'initialize') {
      console.log(`Creating new transport with provided session ID: ${sessionId}`);
      const { randomUUID } = await import('crypto');
      
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
        onsessioninitialized: (sid: string) => {
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
    } else if (!sessionId && req.body && req.body.method === 'initialize') {
      console.log(`Creating new transport with random session ID`);
      const { randomUUID } = await import('crypto');
      
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid: string) => {
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
    } else {
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
  } catch (error) {
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

app.get('/mcp', (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  transport.handleRequest(req, res);
});

app.delete('/mcp', (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  console.log(`Received session termination request for session ${sessionId}`);

  try {
    sessionManager.deleteSession(sessionId);
    const transport = transports[sessionId];
    transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling session termination:', error);
    if (!res.headersSent) {
      res.status(500).send('Error processing session termination');
    }
  }
});

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', activeSessions: sessionManager.getSessionCount() });
});

app.get('/sessions', (req: express.Request, res: express.Response) => {
  const sessionIds = Object.keys(transports);
  res.json({ sessions: sessionIds });
});

// REST API for viewing game state (for spectator/viewer mode)
app.get('/game/:sessionId', (req: express.Request, res: express.Response) => {
  const sessionId = req.params.sessionId as string;
  const engine = sessionManager.getGameEngine(sessionId);
  
  if (!engine) {
    res.status(404).json({ error: 'Game not found for this session' });
    return;
  }
  
  res.json(engine.getBoardState());
});

function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'minesweeper-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  server.registerTool(
    revealCellTool.name,
    revealCellTool.schema,
    async (args: any, ctx: any) => {
      const sessionId = ctx.sessionId;
      if (!sessionId) {
        throw new Error('No session ID');
      }
      const result = await revealCellTool.handler(args, sessionId);
      return result as any;
    }
  );

  server.registerTool(
    flagCellTool.name,
    flagCellTool.schema,
    async (args: any, ctx: any) => {
      const sessionId = ctx.sessionId;
      if (!sessionId) {
        throw new Error('No session ID');
      }
      const result = await flagCellTool.handler(args, sessionId);
      return result as any;
    }
  );

  server.registerTool(
    newGameTool.name,
    newGameTool.schema,
    async (args: any, ctx: any) => {
      const sessionId = ctx.sessionId;
      if (!sessionId) {
        throw new Error('No session ID');
      }
      const result = await newGameTool.handler(args, sessionId);
      return result as any;
    }
  );

  server.registerTool(
    resetGameTool.name,
    resetGameTool.schema,
    async (args: any, ctx: any) => {
      const sessionId = ctx.sessionId;
      if (!sessionId) {
        throw new Error('No session ID');
      }
      const result = await resetGameTool.handler(args, sessionId);
      return result as any;
    }
  );

  server.registerTool(
    getBoardTool.name,
    getBoardTool.schema,
    async (args: any, ctx: any) => {
      const sessionId = ctx.sessionId;
      if (!sessionId) {
        throw new Error('No session ID');
      }
      const result = await getBoardTool.handler(args, sessionId);
      return result as any;
    }
  );

  server.registerResource(
    boardResource.name,
    boardResource.uriTemplate,
    boardResource.schema,
    async (uri: URL, ctx: any) => {
      const sessionId = ctx.sessionId;
      if (!sessionId) {
        throw new Error('No session ID');
      }
      const result = await boardResource.handler(uri, sessionId);
      return result as any;
    }
  );

  server.registerResource(
    gameInfoResource.name,
    gameInfoResource.uriTemplate,
    gameInfoResource.schema,
    async (uri: URL, ctx: any) => {
      const sessionId = ctx.sessionId;
      if (!sessionId) {
        throw new Error('No session ID');
      }
      const result = await gameInfoResource.handler(uri, sessionId);
      return result as any;
    }
  );

  return server;
}

export function startServer() {
  sessionManager.startCleanupTask();

  app.listen(MCP_PORT, () => {
    console.log(`MCP Server listening on port ${MCP_PORT}`);
    console.log(`Health check: http://localhost:${MCP_PORT}/health`);
  });
}
