"use strict";
/**
 * Standalone HTTP client for the Riona AI Agent REST API.
 * Used by both the MCP server and can be imported independently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RionaClient = void 0;
const DEFAULT_BASE_URL = 'http://localhost:3002';
class RionaClient {
    constructor(baseUrl) {
        this.sessionTokens = new Map();
        this.baseUrl = baseUrl || process.env.RIONA_BASE_URL || DEFAULT_BASE_URL;
    }
    async request(options) {
        const url = `${this.baseUrl}${options.path}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
        try {
            const response = await fetch(url, {
                method: options.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal,
            });
            const data = await response.json().catch(() => ({}));
            // Extract JWT from set-cookie if present
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                const match = setCookie.match(/token=([^;]+)/);
                if (match) {
                    return { ...data, _jwt: match[1] };
                }
            }
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            return data;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    getCookieHeader(sessionUsername) {
        const jwt = this.sessionTokens.get(sessionUsername);
        return jwt ? { Cookie: `token=${jwt}` } : {};
    }
    async getStatus() {
        try {
            const data = await this.request({ method: 'GET', path: '/api/status', timeout: 5000 });
            return { serverReachable: true, dbConnected: data?.dbConnected ?? false };
        }
        catch {
            return { serverReachable: false, dbConnected: false };
        }
    }
    async login(username, password) {
        try {
            const data = await this.request({
                method: 'POST',
                path: '/api/login',
                body: { username, password },
                timeout: 120000,
            });
            if (data._jwt) {
                this.sessionTokens.set(username, data._jwt);
            }
            return { success: true, message: data.message || 'Login successful' };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    async interact(sessionUsername) {
        if (!this.sessionTokens.has(sessionUsername)) {
            return { success: false, message: `No session for ${sessionUsername}. Login first.` };
        }
        try {
            const data = await this.request({
                method: 'POST',
                path: '/api/interact',
                headers: this.getCookieHeader(sessionUsername),
                timeout: 180000,
            });
            return { success: true, message: data.message || 'Interaction completed' };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    async sendDm(sessionUsername, targetUsername, message) {
        if (!this.sessionTokens.has(sessionUsername)) {
            return { success: false, message: `No session for ${sessionUsername}. Login first.` };
        }
        try {
            const data = await this.request({
                method: 'POST',
                path: '/api/dm',
                body: { targetUsername, message },
                headers: this.getCookieHeader(sessionUsername),
                timeout: 60000,
            });
            return { success: true, message: data.message || 'DM sent' };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    async sendBulkDm(sessionUsername, targetUsernames, message) {
        if (!this.sessionTokens.has(sessionUsername)) {
            return { success: false, message: `No session for ${sessionUsername}. Login first.`, sentCount: 0 };
        }
        try {
            const data = await this.request({
                method: 'POST',
                path: '/api/dm-file',
                body: { usernames: targetUsernames, message },
                headers: this.getCookieHeader(sessionUsername),
                timeout: 300000,
            });
            return {
                success: true,
                message: data.message || 'Bulk DMs sent',
                sentCount: data.sentCount ?? targetUsernames.length,
            };
        }
        catch (error) {
            return { success: false, message: error.message, sentCount: 0 };
        }
    }
    async scrapeFollowers(sessionUsername, targetAccount, maxFollowers = 100) {
        if (!this.sessionTokens.has(sessionUsername)) {
            return { success: false, followers: [] };
        }
        try {
            const data = await this.request({
                method: 'POST',
                path: '/api/scrape-followers',
                body: { targetAccount, maxFollowers },
                headers: this.getCookieHeader(sessionUsername),
                timeout: 120000,
            });
            return { success: true, followers: data.followers || [] };
        }
        catch {
            return { success: false, followers: [] };
        }
    }
    async logout(sessionUsername) {
        if (this.sessionTokens.has(sessionUsername)) {
            try {
                await this.request({
                    method: 'POST',
                    path: '/api/logout',
                    headers: this.getCookieHeader(sessionUsername),
                    timeout: 10000,
                });
            }
            catch {
                // best-effort
            }
            this.sessionTokens.delete(sessionUsername);
        }
    }
}
exports.RionaClient = RionaClient;
