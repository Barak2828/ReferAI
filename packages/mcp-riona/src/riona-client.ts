/**
 * Standalone HTTP client for the Riona AI Agent REST API.
 * Used by both the MCP server and can be imported independently.
 */

const DEFAULT_BASE_URL = 'http://localhost:3002';

interface RequestOptions {
    method: 'GET' | 'POST' | 'DELETE';
    path: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    timeout?: number;
}

export class RionaClient {
    private baseUrl: string;
    private sessionTokens = new Map<string, string>();

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.RIONA_BASE_URL || DEFAULT_BASE_URL;
    }

    private async request<T = any>(options: RequestOptions): Promise<T> {
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

            const data: any = await response.json().catch(() => ({}));

            // Extract JWT from set-cookie if present
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                const match = setCookie.match(/token=([^;]+)/);
                if (match) {
                    return { ...data, _jwt: match[1] } as T;
                }
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data as T;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private getCookieHeader(sessionUsername: string): Record<string, string> {
        const jwt = this.sessionTokens.get(sessionUsername);
        return jwt ? { Cookie: `token=${jwt}` } : {};
    }

    async getStatus(): Promise<{ serverReachable: boolean; dbConnected: boolean }> {
        try {
            const data = await this.request({ method: 'GET', path: '/api/status', timeout: 5000 });
            return { serverReachable: true, dbConnected: data?.dbConnected ?? false };
        } catch {
            return { serverReachable: false, dbConnected: false };
        }
    }

    async login(username: string, password: string): Promise<{ success: boolean; message: string }> {
        try {
            const data = await this.request<any>({
                method: 'POST',
                path: '/api/login',
                body: { username, password },
                timeout: 120000,
            });
            if (data._jwt) {
                this.sessionTokens.set(username, data._jwt);
            }
            return { success: true, message: data.message || 'Login successful' };
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async interact(sessionUsername: string): Promise<{ success: boolean; message: string }> {
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
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async sendDm(
        sessionUsername: string,
        targetUsername: string,
        message: string,
    ): Promise<{ success: boolean; message: string }> {
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
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    async sendBulkDm(
        sessionUsername: string,
        targetUsernames: string[],
        message: string,
    ): Promise<{ success: boolean; message: string; sentCount: number }> {
        if (!this.sessionTokens.has(sessionUsername)) {
            return { success: false, message: `No session for ${sessionUsername}. Login first.`, sentCount: 0 };
        }
        try {
            const data = await this.request<any>({
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
        } catch (error: any) {
            return { success: false, message: error.message, sentCount: 0 };
        }
    }

    async scrapeFollowers(
        sessionUsername: string,
        targetAccount: string,
        maxFollowers: number = 100,
    ): Promise<{ success: boolean; followers: string[] }> {
        if (!this.sessionTokens.has(sessionUsername)) {
            return { success: false, followers: [] };
        }
        try {
            const data = await this.request<any>({
                method: 'POST',
                path: '/api/scrape-followers',
                body: { targetAccount, maxFollowers },
                headers: this.getCookieHeader(sessionUsername),
                timeout: 120000,
            });
            return { success: true, followers: data.followers || [] };
        } catch {
            return { success: false, followers: [] };
        }
    }

    async logout(sessionUsername: string): Promise<void> {
        if (this.sessionTokens.has(sessionUsername)) {
            try {
                await this.request({
                    method: 'POST',
                    path: '/api/logout',
                    headers: this.getCookieHeader(sessionUsername),
                    timeout: 10000,
                });
            } catch {
                // best-effort
            }
            this.sessionTokens.delete(sessionUsername);
        }
    }
}
