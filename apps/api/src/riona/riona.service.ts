import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface RionaStatus {
    serverReachable: boolean;
    dbConnected: boolean;
}

export interface RionaLoginResult {
    success: boolean;
    message: string;
    jwt?: string;
}

export interface RionaInteractResult {
    success: boolean;
    message: string;
}

export interface RionaDmResult {
    success: boolean;
    message: string;
}

export interface RionaScrapeResult {
    success: boolean;
    followers: string[];
}

@Injectable()
export class RionaService {
    private readonly logger = new Logger(RionaService.name);
    private readonly baseUrl: string;

    // Store JWT tokens per Instagram session
    private sessionTokens = new Map<string, string>();

    constructor(private readonly httpService: HttpService) {
        this.baseUrl = process.env.RIONA_BASE_URL || 'http://localhost:3002';
    }

    async getStatus(): Promise<RionaStatus> {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/api/status`, { timeout: 5000 }),
            );
            return { serverReachable: true, dbConnected: data?.dbConnected ?? false };
        } catch {
            return { serverReachable: false, dbConnected: false };
        }
    }

    async login(username: string, password: string): Promise<RionaLoginResult> {
        try {
            const { data, headers } = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/api/login`,
                    { username, password },
                    { timeout: 120000 }, // Puppeteer login can take 2 min
                ),
            );

            // Extract JWT from set-cookie header or response body
            const cookies = headers['set-cookie'];
            let jwt: string | undefined;
            if (cookies) {
                const tokenCookie = (Array.isArray(cookies) ? cookies : [cookies])
                    .find((c) => c.startsWith('token='));
                if (tokenCookie) {
                    jwt = tokenCookie.split('=')[1]?.split(';')[0];
                }
            }
            if (jwt) {
                this.sessionTokens.set(username, jwt);
            }

            return { success: true, message: data?.message || 'Login successful', jwt };
        } catch (error: any) {
            this.logger.error(`Login failed for ${username}: ${error.message}`);
            return { success: false, message: error.response?.data?.message || error.message };
        }
    }

    async interact(sessionUsername: string): Promise<RionaInteractResult> {
        const jwt = this.sessionTokens.get(sessionUsername);
        if (!jwt) {
            return { success: false, message: `No active session for ${sessionUsername}. Login first.` };
        }
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/api/interact`,
                    {},
                    { headers: { Cookie: `token=${jwt}` }, timeout: 180000 },
                ),
            );
            return { success: true, message: data?.message || 'Interaction completed' };
        } catch (error: any) {
            this.logger.error(`Interact failed: ${error.message}`);
            return { success: false, message: error.response?.data?.message || error.message };
        }
    }

    async sendDm(
        sessionUsername: string,
        targetUsername: string,
        message: string,
    ): Promise<RionaDmResult> {
        const jwt = this.sessionTokens.get(sessionUsername);
        if (!jwt) {
            return { success: false, message: `No active session for ${sessionUsername}. Login first.` };
        }
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/api/dm`,
                    { username: targetUsername, message },
                    { headers: { Cookie: `token=${jwt}` }, timeout: 60000 },
                ),
            );
            return { success: true, message: data?.message || 'DM sent' };
        } catch (error: any) {
            this.logger.error(`DM failed: ${error.message}`);
            return { success: false, message: error.response?.data?.message || error.message };
        }
    }

    async sendBulkDm(
        sessionUsername: string,
        targetUsernames: string[],
        message: string,
    ): Promise<RionaDmResult & { sentCount: number }> {
        const jwt = this.sessionTokens.get(sessionUsername);
        if (!jwt) {
            return { success: false, message: `No active session for ${sessionUsername}. Login first.`, sentCount: 0 };
        }
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/api/dm-file`,
                    { usernames: targetUsernames, message },
                    { headers: { Cookie: `token=${jwt}` }, timeout: 300000 }, // bulk can be slow
                ),
            );
            return {
                success: true,
                message: data?.message || 'Bulk DMs sent',
                sentCount: data?.sentCount ?? targetUsernames.length,
            };
        } catch (error: any) {
            this.logger.error(`Bulk DM failed: ${error.message}`);
            return { success: false, message: error.response?.data?.message || error.message, sentCount: 0 };
        }
    }

    async scrapeFollowers(
        sessionUsername: string,
        targetAccount: string,
        maxFollowers: number = 100,
    ): Promise<RionaScrapeResult> {
        const jwt = this.sessionTokens.get(sessionUsername);
        if (!jwt) {
            return { success: false, followers: [] };
        }
        try {
            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${this.baseUrl}/api/scrape-followers`,
                    { targetAccount, maxFollowers },
                    { headers: { Cookie: `token=${jwt}` }, timeout: 120000 },
                ),
            );
            return { success: true, followers: data?.followers || [] };
        } catch (error: any) {
            this.logger.error(`Scrape failed: ${error.message}`);
            return { success: false, followers: [] };
        }
    }

    async logout(sessionUsername: string): Promise<void> {
        const jwt = this.sessionTokens.get(sessionUsername);
        if (jwt) {
            try {
                await firstValueFrom(
                    this.httpService.post(
                        `${this.baseUrl}/api/logout`,
                        {},
                        { headers: { Cookie: `token=${jwt}` }, timeout: 10000 },
                    ),
                );
            } catch {
                // Best-effort logout
            }
            this.sessionTokens.delete(sessionUsername);
        }
    }

    hasSession(username: string): boolean {
        return this.sessionTokens.has(username);
    }
}
