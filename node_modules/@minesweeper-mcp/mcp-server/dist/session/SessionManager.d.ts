import { GameEngine } from '@minesweeper-mcp/shared';
export declare class SessionManager {
    private sessions;
    private readonly SESSION_TIMEOUT;
    getGameEngine(sessionId: string): GameEngine | null;
    createSession(sessionId: string, engine: GameEngine): void;
    hasSession(sessionId: string): boolean;
    deleteSession(sessionId: string): void;
    cleanupExpiredSessions(): void;
    getSessionCount(): number;
    startCleanupTask(): void;
}
export declare const sessionManager: SessionManager;
