import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { RionaClient } from './riona-client.js';

export function createRionaMcpServer(): McpServer {
    const server = new McpServer({
        name: 'riona-social-agent',
        version: '0.1.0',
    });

    const client = new RionaClient();

    // Cast to any to avoid "Type instantiation is excessively deep" errors
    // from McpServer.tool's complex zod type inference
    const tool = server.tool.bind(server) as any;

    // Tool 1: Status check
    server.tool(
        'riona_status',
        'Check the health and connectivity of the Riona AI social media agent and its database',
        {},
        async () => {
            const result = await client.getStatus();
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // Tool 2: Login to Instagram
    tool(
        'riona_login_instagram',
        'Authenticate an Instagram account through the Riona agent. Launches a Puppeteer browser session. This can take up to 2 minutes.',
        {
            username: z.string().describe('Instagram username'),
            password: z.string().describe('Instagram password'),
        },
        async ({ username, password }: { username: string; password: string }) => {
            const result = await client.login(username, password);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // Tool 3: Interact with posts (like + AI comment)
    tool(
        'riona_interact_posts',
        'Interact with Instagram feed posts by liking and adding AI-generated comments. Requires an active login session. The AI uses the Gemini model to generate contextual comments.',
        {
            sessionUsername: z.string().describe('Instagram username of the active session'),
        },
        async ({ sessionUsername }: { sessionUsername: string }) => {
            const result = await client.interact(sessionUsername);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // Tool 4: Send DM
    tool(
        'riona_send_dm',
        'Send a direct message to an Instagram user. Requires an active login session.',
        {
            sessionUsername: z.string().describe('Instagram username of the active session'),
            targetUsername: z.string().describe('Instagram username of the recipient'),
            message: z.string().describe('The message text to send'),
        },
        async ({ sessionUsername, targetUsername, message }: { sessionUsername: string; targetUsername: string; message: string }) => {
            const result = await client.sendDm(sessionUsername, targetUsername, message);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // Tool 5: Send bulk DMs
    tool(
        'riona_send_bulk_dm',
        'Send a direct message to multiple Instagram users. Useful for campaign outreach. Requires an active login session. Can take several minutes for large lists.',
        {
            sessionUsername: z.string().describe('Instagram username of the active session'),
            targetUsernames: z.array(z.string()).describe('List of Instagram usernames to message'),
            message: z.string().describe('The message text to send to all recipients'),
        },
        async ({ sessionUsername, targetUsernames, message }: { sessionUsername: string; targetUsernames: string[]; message: string }) => {
            const result = await client.sendBulkDm(sessionUsername, targetUsernames, message);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        },
    );

    // Tool 6: Scrape followers
    tool(
        'riona_scrape_followers',
        'Scrape the follower list of a target Instagram account. Returns usernames. Requires an active login session.',
        {
            sessionUsername: z.string().describe('Instagram username of the active session'),
            targetAccount: z.string().describe('Instagram account whose followers to scrape'),
            maxFollowers: z.number().optional().describe('Maximum number of followers to scrape (default 100)'),
        },
        async ({ sessionUsername, targetAccount, maxFollowers }: { sessionUsername: string; targetAccount: string; maxFollowers?: number }) => {
            const result = await client.scrapeFollowers(sessionUsername, targetAccount, maxFollowers ?? 100);
            return {
                content: [
                    {
                        type: 'text',
                        text: result.success
                            ? `Scraped ${result.followers.length} followers:\n${result.followers.join('\n')}`
                            : 'Failed to scrape followers. Ensure you are logged in.',
                    },
                ],
            };
        },
    );

    return server;
}
