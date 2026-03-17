import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

@Injectable()
export class OAuthService {
    private readonly logger = new Logger(OAuthService.name);
    private readonly encryptionKey: Buffer;

    constructor(
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
    ) {
        // Reuse the same encryption key as SocialCredentialsService
        const key = process.env.SOCIAL_CREDENTIALS_ENCRYPTION_KEY;
        if (key && key.length >= 32) {
            this.encryptionKey = Buffer.from(key.slice(0, 32), 'utf-8');
        } else {
            this.encryptionKey = crypto.scryptSync('dev-fallback-key', 'salt', 32);
            this.logger.warn('Using fallback encryption key for OAuth tokens.');
        }
    }

    /**
     * Encrypt a token string using AES-256-GCM.
     */
    encryptToken(plaintext: string): string {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    /**
     * Decrypt a token string.
     */
    decryptToken(ciphertext: string): string {
        const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
    }

    /**
     * Store an OAuth token for a social account.
     */
    async storeToken(
        accountId: string,
        accessToken: string,
        refreshToken: string | null,
        expiresAt: Date | null,
        platformUserId: string | null,
        platformMeta: Record<string, any> | null,
        scopes: string | null,
    ) {
        const encryptedAccess = this.encryptToken(accessToken);
        const encryptedRefresh = refreshToken ? this.encryptToken(refreshToken) : null;

        return this.prisma.oAuthToken.upsert({
            where: { accountId },
            update: {
                accessToken: encryptedAccess,
                refreshToken: encryptedRefresh,
                tokenExpiresAt: expiresAt,
                platformUserId,
                platformMeta: platformMeta ? JSON.stringify(platformMeta) : null,
                scopes,
            },
            create: {
                accountId,
                accessToken: encryptedAccess,
                refreshToken: encryptedRefresh,
                tokenExpiresAt: expiresAt,
                platformUserId,
                platformMeta: platformMeta ? JSON.stringify(platformMeta) : null,
                scopes,
            },
        });
    }

    /**
     * Get a valid token for a social account, refreshing if needed.
     */
    async getValidToken(accountId: string) {
        const token = await this.prisma.oAuthToken.findUnique({
            where: { accountId },
        });

        if (!token) return null;

        // Check if token is expired and needs refresh
        if (token.tokenExpiresAt && token.tokenExpiresAt < new Date()) {
            if (token.refreshToken) {
                // Determine platform from account
                const account = await this.prisma.socialAccount.findUnique({
                    where: { id: accountId },
                });
                if (account) {
                    const refreshed = await this.refreshToken(token, account.platform);
                    if (refreshed) return refreshed;
                }
            }
            return null; // Token expired and can't refresh
        }

        return token;
    }

    /**
     * Refresh an expired OAuth token.
     */
    private async refreshToken(
        token: { id: string; refreshToken: string | null; accountId: string },
        platform: string,
    ) {
        if (!token.refreshToken) return null;

        const refreshToken = this.decryptToken(token.refreshToken);

        try {
            let newAccessToken: string;
            let newRefreshToken: string | undefined;
            let expiresIn: number | undefined;

            if (platform === 'FACEBOOK') {
                // Facebook token refresh
                const { data } = await firstValueFrom(
                    this.httpService.get(
                        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${refreshToken}`,
                        { timeout: 10000 },
                    ),
                );
                newAccessToken = data.access_token;
                expiresIn = data.expires_in;
            } else if (platform === 'GOOGLE_BUSINESS' || platform === 'YOUTUBE') {
                // Google token refresh
                const { data } = await firstValueFrom(
                    this.httpService.post(
                        'https://oauth2.googleapis.com/token',
                        {
                            client_id: process.env.GOOGLE_CLIENT_ID,
                            client_secret: process.env.GOOGLE_CLIENT_SECRET,
                            refresh_token: refreshToken,
                            grant_type: 'refresh_token',
                        },
                        { timeout: 10000 },
                    ),
                );
                newAccessToken = data.access_token;
                expiresIn = data.expires_in;
                newRefreshToken = data.refresh_token; // Google sometimes returns new refresh token
            } else {
                return null;
            }

            // Update stored token
            const encryptedAccess = this.encryptToken(newAccessToken);
            const expiresAt = expiresIn
                ? new Date(Date.now() + expiresIn * 1000)
                : null;

            const updated = await this.prisma.oAuthToken.update({
                where: { id: token.id },
                data: {
                    accessToken: encryptedAccess,
                    tokenExpiresAt: expiresAt,
                    ...(newRefreshToken
                        ? { refreshToken: this.encryptToken(newRefreshToken) }
                        : {}),
                },
            });

            return updated;
        } catch (error: any) {
            this.logger.error(`Token refresh failed for ${platform}: ${error.message}`);
            return null;
        }
    }

    /**
     * Delete OAuth token for an account.
     */
    async deleteToken(accountId: string) {
        try {
            await this.prisma.oAuthToken.delete({ where: { accountId } });
        } catch {
            // Token may not exist
        }
    }

    // ─── Facebook OAuth Helpers ────────────────────────────────

    getFacebookAuthUrl(redirectUri: string, state: string): string {
        const appId = process.env.FACEBOOK_APP_ID;
        const scopes = 'pages_manage_posts,pages_read_engagement,pages_show_list';
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
    }

    async exchangeFacebookCode(
        code: string,
        redirectUri: string,
    ): Promise<{
        accessToken: string;
        expiresIn: number;
        userId: string;
    }> {
        // Exchange code for short-lived user token
        const { data: tokenData } = await firstValueFrom(
            this.httpService.get(
                `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
                { timeout: 10000 },
            ),
        );

        // Exchange for long-lived token
        const { data: longLivedData } = await firstValueFrom(
            this.httpService.get(
                `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`,
                { timeout: 10000 },
            ),
        );

        // Get user ID
        const { data: userData } = await firstValueFrom(
            this.httpService.get(
                `https://graph.facebook.com/v18.0/me?access_token=${longLivedData.access_token}`,
                { timeout: 10000 },
            ),
        );

        return {
            accessToken: longLivedData.access_token,
            expiresIn: longLivedData.expires_in || 5184000, // ~60 days
            userId: userData.id,
        };
    }

    async getFacebookPages(userAccessToken: string): Promise<Array<{ id: string; name: string; access_token: string }>> {
        const { data } = await firstValueFrom(
            this.httpService.get(
                `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`,
                { timeout: 10000 },
            ),
        );
        return data.data || [];
    }

    // ─── Instagram (via Facebook) OAuth Helpers ──────────────────

    getInstagramAuthUrl(redirectUri: string, state: string): string {
        const appId = process.env.FACEBOOK_APP_ID;
        const scopes = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
    }

    async exchangeInstagramCode(
        code: string,
        redirectUri: string,
    ): Promise<{
        accessToken: string;
        expiresIn: number;
        userId: string;
        igUserId: string;
        igUsername: string;
        pageId: string;
        pageName: string;
        pageAccessToken: string;
    }> {
        // Exchange code for user access token (reuses Facebook flow)
        const tokenResult = await this.exchangeFacebookCode(code, redirectUri);

        // Get pages with Instagram business accounts
        const { data: pagesData } = await firstValueFrom(
            this.httpService.get(
                `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${tokenResult.accessToken}`,
                { timeout: 10000 },
            ),
        );

        const pages = pagesData.data || [];
        const pageWithIG = pages.find((p: any) => p.instagram_business_account);
        if (!pageWithIG) {
            throw new Error('No Instagram Business account found. Convert your Instagram to a Business/Creator account and link it to a Facebook Page.');
        }

        const igUserId = pageWithIG.instagram_business_account.id;

        // Get IG username
        const { data: igData } = await firstValueFrom(
            this.httpService.get(
                `https://graph.facebook.com/v18.0/${igUserId}?fields=username,name&access_token=${pageWithIG.access_token}`,
                { timeout: 10000 },
            ),
        );

        return {
            accessToken: tokenResult.accessToken,
            expiresIn: tokenResult.expiresIn,
            userId: tokenResult.userId,
            igUserId,
            igUsername: igData.username || igData.name || 'instagram_user',
            pageId: pageWithIG.id,
            pageName: pageWithIG.name,
            pageAccessToken: pageWithIG.access_token,
        };
    }

    // ─── Google OAuth Helpers ──────────────────────────────────

    getGoogleAuthUrl(redirectUri: string, state: string, scopes: string[]): string {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const scopeStr = scopes.join(' ');
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopeStr)}&state=${state}&response_type=code&access_type=offline&prompt=consent`;
    }

    async exchangeGoogleCode(
        code: string,
        redirectUri: string,
    ): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        const { data } = await firstValueFrom(
            this.httpService.post(
                'https://oauth2.googleapis.com/token',
                {
                    code,
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                },
                { timeout: 10000 },
            ),
        );

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in || 3600,
        };
    }
}
