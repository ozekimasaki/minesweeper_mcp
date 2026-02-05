import { GameEngine } from '@minesweeper-mcp/shared';

interface SessionData {
  sessionId: string;
  engine: GameEngine;
  createdAt: Date;
  lastAccessed: Date;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30分

  getGameEngine(sessionId: string): GameEngine | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    session.lastAccessed = new Date();
    return session.engine;
  }

  createSession(sessionId: string, engine: GameEngine): void {
    this.sessions.set(sessionId, {
      sessionId,
      engine,
      createdAt: new Date(),
      lastAccessed: new Date(),
    });
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessed.getTime() > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
        console.log(`Expired session ${sessionId} cleaned up`);
      }
    }
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  startCleanupTask(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // 5分ごとにクリーンアップ
  }
}

export const sessionManager = new SessionManager();
