"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = exports.SessionManager = void 0;
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.SESSION_TIMEOUT = 30 * 60 * 1000; // 30分
    }
    getGameEngine(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.lastAccessed = new Date();
        return session.engine;
    }
    createSession(sessionId, engine) {
        this.sessions.set(sessionId, {
            sessionId,
            engine,
            createdAt: new Date(),
            lastAccessed: new Date(),
        });
    }
    hasSession(sessionId) {
        return this.sessions.has(sessionId);
    }
    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
    }
    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.lastAccessed.getTime() > this.SESSION_TIMEOUT) {
                this.sessions.delete(sessionId);
                console.log(`Expired session ${sessionId} cleaned up`);
            }
        }
    }
    getSessionCount() {
        return this.sessions.size;
    }
    startCleanupTask() {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000); // 5分ごとにクリーンアップ
    }
}
exports.SessionManager = SessionManager;
exports.sessionManager = new SessionManager();
