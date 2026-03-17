/**
 * Standalone HTTP client for the Riona AI Agent REST API.
 * Used by both the MCP server and can be imported independently.
 */
export declare class RionaClient {
    private baseUrl;
    private sessionTokens;
    constructor(baseUrl?: string);
    private request;
    private getCookieHeader;
    getStatus(): Promise<{
        serverReachable: boolean;
        dbConnected: boolean;
    }>;
    login(username: string, password: string): Promise<{
        success: boolean;
        message: string;
    }>;
    interact(sessionUsername: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendDm(sessionUsername: string, targetUsername: string, message: string): Promise<{
        success: boolean;
        message: string;
    }>;
    sendBulkDm(sessionUsername: string, targetUsernames: string[], message: string): Promise<{
        success: boolean;
        message: string;
        sentCount: number;
    }>;
    scrapeFollowers(sessionUsername: string, targetAccount: string, maxFollowers?: number): Promise<{
        success: boolean;
        followers: string[];
    }>;
    logout(sessionUsername: string): Promise<void>;
}
