"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRionaMcpServer = createRionaMcpServer;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = require("zod");
const riona_client_js_1 = require("./riona-client.js");
function createRionaMcpServer() {
    const server = new mcp_js_1.McpServer({
        name: 'riona-social-agent',
        version: '0.1.0',
    });
    const client = new riona_client_js_1.RionaClient();
    // Cast to any to avoid "Type instantiation is excessively deep" errors
    // from McpServer.tool's complex zod type inference
    const tool = server.tool.bind(server);
    // Tool 1: Status check
    server.tool('riona_status', 'Check the health and connectivity of the Riona AI social media agent and its database', {}, async () => {
        const result = await client.getStatus();
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    });
    // Tool 2: Login to Instagram
    tool('riona_login_instagram', 'Authenticate an Instagram account through the Riona agent. Launches a Puppeteer browser session. This can take up to 2 minutes.', {
        username: zod_1.z.string().describe('Instagram username'),
        password: zod_1.z.string().describe('Instagram password'),
    }, async ({ username, password }) => {
        const result = await client.login(username, password);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    });
    // Tool 3: Interact with posts (like + AI comment)
    tool('riona_interact_posts', 'Interact with Instagram feed posts by liking and adding AI-generated comments. Requires an active login session. The AI uses the Gemini model to generate contextual comments.', {
        sessionUsername: zod_1.z.string().describe('Instagram username of the active session'),
    }, async ({ sessionUsername }) => {
        const result = await client.interact(sessionUsername);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    });
    // Tool 4: Send DM
    tool('riona_send_dm', 'Send a direct message to an Instagram user. Requires an active login session.', {
        sessionUsername: zod_1.z.string().describe('Instagram username of the active session'),
        targetUsername: zod_1.z.string().describe('Instagram username of the recipient'),
        message: zod_1.z.string().describe('The message text to send'),
    }, async ({ sessionUsername, targetUsername, message }) => {
        const result = await client.sendDm(sessionUsername, targetUsername, message);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    });
    // Tool 5: Send bulk DMs
    tool('riona_send_bulk_dm', 'Send a direct message to multiple Instagram users. Useful for campaign outreach. Requires an active login session. Can take several minutes for large lists.', {
        sessionUsername: zod_1.z.string().describe('Instagram username of the active session'),
        targetUsernames: zod_1.z.array(zod_1.z.string()).describe('List of Instagram usernames to message'),
        message: zod_1.z.string().describe('The message text to send to all recipients'),
    }, async ({ sessionUsername, targetUsernames, message }) => {
        const result = await client.sendBulkDm(sessionUsername, targetUsernames, message);
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    });
    // Tool 6: Scrape followers
    tool('riona_scrape_followers', 'Scrape the follower list of a target Instagram account. Returns usernames. Requires an active login session.', {
        sessionUsername: zod_1.z.string().describe('Instagram username of the active session'),
        targetAccount: zod_1.z.string().describe('Instagram account whose followers to scrape'),
        maxFollowers: zod_1.z.number().optional().describe('Maximum number of followers to scrape (default 100)'),
    }, async ({ sessionUsername, targetAccount, maxFollowers }) => {
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
    });
    return server;
}
