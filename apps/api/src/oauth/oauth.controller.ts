import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('oauth')
export class OAuthController {
    constructor(
        private readonly oauthService: OAuthService,
        private readonly prisma: PrismaService,
    ) {}

    // ─── Facebook ──────────────────────────────────────────────

    /**
     * GET /oauth/facebook/auth-url?redirectUri=...&state=...
     * Frontend calls: getFacebookAuthUrl(redirectUri, state)
     */
    @Get('facebook/auth-url')
    getFacebookAuthUrl(
        @Query('redirectUri') redirectUri: string,
        @Query('state') state: string,
    ) {
        const url = this.oauthService.getFacebookAuthUrl(redirectUri, state);
        return { url };
    }

    /**
     * POST /oauth/facebook/exchange
     * Frontend calls: exchangeFacebookCode(code, redirectUri, userId, selectedPageId?)
     * Exchanges code → tokens, creates SocialAccount, stores OAuth token.
     */
    @Post('facebook/exchange')
    @HttpCode(HttpStatus.OK)
    async exchangeFacebookCode(
        @Body() body: {
            code: string;
            redirectUri: string;
            userId: string;
            selectedPageId?: string;
        },
    ) {
        try {
            const tokenResult = await this.oauthService.exchangeFacebookCode(body.code, body.redirectUri);

            // Get Facebook pages for the user
            const pages = await this.oauthService.getFacebookPages(tokenResult.accessToken);

            // If no page is selected yet and there are pages, return them for selection
            if (!body.selectedPageId && pages.length > 1) {
                return { success: true, pages, needsPageSelection: true };
            }

            // Select the page (first one if not specified)
            const selectedPage = body.selectedPageId
                ? pages.find((p) => p.id === body.selectedPageId) || pages[0]
                : pages[0];

            if (!selectedPage) {
                return { success: false, message: 'No Facebook pages found for this account' };
            }

            // Create or update SocialAccount
            const account = await this.prisma.socialAccount.upsert({
                where: {
                    userId_platform_username: {
                        userId: body.userId,
                        platform: 'FACEBOOK',
                        username: selectedPage.name,
                    },
                },
                update: {
                    isActive: true,
                    connectionType: 'OAUTH',
                },
                create: {
                    userId: body.userId,
                    platform: 'FACEBOOK',
                    username: selectedPage.name,
                    encryptedCredentials: '', // OAuth uses OAuthToken, not encrypted credentials
                    isActive: true,
                    connectionType: 'OAUTH',
                },
            });

            // Store the page access token (more useful than user token)
            await this.oauthService.storeToken(
                account.id,
                selectedPage.access_token,
                tokenResult.accessToken, // user token as refresh
                new Date(Date.now() + tokenResult.expiresIn * 1000),
                tokenResult.userId,
                { pageId: selectedPage.id, pageName: selectedPage.name },
                'pages_manage_posts,pages_read_engagement',
            );

            return { success: true, account };
        } catch (error: any) {
            return { success: false, message: error.message || 'Facebook code exchange failed' };
        }
    }

    /**
     * POST /oauth/facebook/pages
     */
    @Post('facebook/pages')
    @HttpCode(HttpStatus.OK)
    async getFacebookPages(@Body() body: { accessToken: string }) {
        try {
            const pages = await this.oauthService.getFacebookPages(body.accessToken);
            return { success: true, pages };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to get Facebook pages' };
        }
    }

    // ─── Instagram (via Facebook OAuth) ────────────────────────

    @Get('instagram/auth-url')
    getInstagramAuthUrl(
        @Query('redirectUri') redirectUri: string,
        @Query('state') state: string,
    ) {
        const url = this.oauthService.getInstagramAuthUrl(redirectUri, state);
        return { url };
    }

    @Post('instagram/exchange')
    @HttpCode(HttpStatus.OK)
    async exchangeInstagramCode(
        @Body() body: {
            code: string;
            redirectUri: string;
            userId: string;
        },
    ) {
        try {
            const result = await this.oauthService.exchangeInstagramCode(body.code, body.redirectUri);

            // Create or update SocialAccount for Instagram (OAuth type)
            const account = await this.prisma.socialAccount.upsert({
                where: {
                    userId_platform_username: {
                        userId: body.userId,
                        platform: 'INSTAGRAM',
                        username: result.igUsername,
                    },
                },
                update: {
                    isActive: true,
                    connectionType: 'OAUTH',
                },
                create: {
                    userId: body.userId,
                    platform: 'INSTAGRAM',
                    username: result.igUsername,
                    encryptedCredentials: '',
                    isActive: true,
                    connectionType: 'OAUTH',
                },
            });

            // Store the page access token (needed for IG Graph API publishing)
            await this.oauthService.storeToken(
                account.id,
                result.pageAccessToken,
                result.accessToken, // user token as refresh fallback
                new Date(Date.now() + result.expiresIn * 1000),
                result.igUserId,
                {
                    igUserId: result.igUserId,
                    igUsername: result.igUsername,
                    pageId: result.pageId,
                    pageName: result.pageName,
                },
                'instagram_basic,instagram_content_publish',
            );

            return { success: true, account };
        } catch (error: any) {
            return { success: false, message: error.message || 'Instagram OAuth failed' };
        }
    }

    // ─── Google (YouTube + Google Business) ────────────────────

    /**
     * GET /oauth/google/auth-url?redirectUri=...&state=...&type=youtube|business
     * Frontend calls: getGoogleAuthUrl(redirectUri, state, type)
     */
    @Get('google/auth-url')
    getGoogleAuthUrl(
        @Query('redirectUri') redirectUri: string,
        @Query('state') state: string,
        @Query('type') type: string,
    ) {
        const scopes =
            type === 'youtube'
                ? [
                      'https://www.googleapis.com/auth/youtube.upload',
                      'https://www.googleapis.com/auth/youtube',
                  ]
                : [
                      'https://www.googleapis.com/auth/business.manage',
                  ];

        const url = this.oauthService.getGoogleAuthUrl(redirectUri, state, scopes);
        return { url };
    }

    /**
     * POST /oauth/google/exchange
     * Frontend calls: exchangeGoogleCode(code, redirectUri, userId, platform, platformMeta?)
     */
    @Post('google/exchange')
    @HttpCode(HttpStatus.OK)
    async exchangeGoogleCode(
        @Body() body: {
            code: string;
            redirectUri: string;
            userId: string;
            platform: 'GOOGLE_BUSINESS' | 'YOUTUBE';
            platformMeta?: Record<string, any>;
        },
    ) {
        try {
            const tokenResult = await this.oauthService.exchangeGoogleCode(body.code, body.redirectUri);

            // Create or update SocialAccount
            const displayName = body.platform === 'YOUTUBE' ? 'YouTube Channel' : 'Google Business';
            const account = await this.prisma.socialAccount.upsert({
                where: {
                    userId_platform_username: {
                        userId: body.userId,
                        platform: body.platform,
                        username: displayName,
                    },
                },
                update: {
                    isActive: true,
                    connectionType: 'OAUTH',
                },
                create: {
                    userId: body.userId,
                    platform: body.platform,
                    username: displayName,
                    encryptedCredentials: '',
                    isActive: true,
                    connectionType: 'OAUTH',
                },
            });

            // Store tokens
            await this.oauthService.storeToken(
                account.id,
                tokenResult.accessToken,
                tokenResult.refreshToken,
                new Date(Date.now() + tokenResult.expiresIn * 1000),
                null,
                body.platformMeta || null,
                body.platform === 'YOUTUBE'
                    ? 'youtube.upload,youtube'
                    : 'business.manage',
            );

            return { success: true, account };
        } catch (error: any) {
            return { success: false, message: error.message || 'Google code exchange failed' };
        }
    }

    // ─── WhatsApp (API Key) ────────────────────────────────────

    /**
     * POST /oauth/whatsapp/connect
     * Frontend calls: connectWhatsApp(userId, apiToken, phoneNumberId, businessName)
     */
    @Post('whatsapp/connect')
    @HttpCode(HttpStatus.OK)
    async connectWhatsApp(
        @Body() body: {
            userId: string;
            apiToken: string;
            phoneNumberId: string;
            businessName: string;
        },
    ) {
        try {
            // Create or update SocialAccount
            const account = await this.prisma.socialAccount.upsert({
                where: {
                    userId_platform_username: {
                        userId: body.userId,
                        platform: 'WHATSAPP',
                        username: body.businessName,
                    },
                },
                update: {
                    isActive: true,
                    connectionType: 'API_KEY',
                },
                create: {
                    userId: body.userId,
                    platform: 'WHATSAPP',
                    username: body.businessName,
                    encryptedCredentials: '',
                    isActive: true,
                    connectionType: 'API_KEY',
                },
            });

            // Store the API token as an OAuth token
            await this.oauthService.storeToken(
                account.id,
                body.apiToken,
                null,
                null,
                body.phoneNumberId,
                { businessName: body.businessName, phoneNumberId: body.phoneNumberId },
                null,
            );

            return { success: true, account };
        } catch (error: any) {
            return { success: false, message: error.message || 'WhatsApp connection failed' };
        }
    }

    // ─── Token Management ──────────────────────────────────────

    @Post('store-token')
    @HttpCode(HttpStatus.OK)
    async storeToken(
        @Body() body: {
            accountId: string;
            accessToken: string;
            refreshToken?: string;
            expiresAt?: string;
            platformUserId?: string;
            platformMeta?: Record<string, any>;
            scopes?: string;
        },
    ) {
        try {
            await this.oauthService.storeToken(
                body.accountId,
                body.accessToken,
                body.refreshToken || null,
                body.expiresAt ? new Date(body.expiresAt) : null,
                body.platformUserId || null,
                body.platformMeta || null,
                body.scopes || null,
            );
            return { success: true, message: 'Token stored successfully' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to store token' };
        }
    }

    @Post('delete-token')
    @HttpCode(HttpStatus.OK)
    async deleteToken(@Body() body: { accountId: string }) {
        await this.oauthService.deleteToken(body.accountId);
        return { success: true, message: 'Token deleted' };
    }
}
