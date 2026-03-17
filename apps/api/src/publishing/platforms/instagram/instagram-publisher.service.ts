import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IPlatformPublisher, PublishRequest, PublishResult, AccountValidationResult } from '../platform.interface';
import { RionaService } from '../../../riona/riona.service';
import { SocialCredentialsService } from '../../../social-credentials/social-credentials.service';
import { OAuthService } from '../../../oauth/oauth.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class InstagramPublisherService implements IPlatformPublisher {
    private readonly logger = new Logger(InstagramPublisherService.name);
    readonly platform = 'INSTAGRAM';

    constructor(
        private readonly rionaService: RionaService,
        private readonly credentialsService: SocialCredentialsService,
        private readonly oauthService: OAuthService,
        private readonly prisma: PrismaService,
        private readonly httpService: HttpService,
    ) {}

    async publish(request: PublishRequest): Promise<PublishResult> {
        const account = await this.prisma.socialAccount.findUnique({
            where: { id: request.accountId },
        });

        if (!account) {
            return { success: false, message: 'Instagram account not found' };
        }

        // OAuth accounts use Graph API, credential accounts use Riona
        if (account.connectionType === 'OAUTH') {
            return this.publishViaGraphApi(request, account.id);
        }

        return this.publishViaRiona(request);
    }

    /**
     * Publish via Instagram Graph API (Business/Creator accounts).
     * Supports image posts and reels.
     */
    private async publishViaGraphApi(request: PublishRequest, accountId: string): Promise<PublishResult> {
        try {
            const token = await this.oauthService.getValidToken(accountId);
            if (!token) {
                return { success: false, message: 'Instagram OAuth token expired. Please reconnect.' };
            }

            const accessToken = this.oauthService.decryptToken(token.accessToken);
            const meta = token.platformMeta ? JSON.parse(token.platformMeta) : {};
            const igUserId = token.platformUserId || meta.igUserId;

            if (!igUserId) {
                return { success: false, message: 'Instagram user ID not found in token metadata' };
            }

            const imageUrl = request.contentMeta?.imageUrl as string | undefined;
            const videoUrl = request.contentMeta?.videoUrl as string | undefined;

            if (videoUrl) {
                return this.publishReel(igUserId, accessToken, request.contentText, videoUrl);
            } else if (imageUrl) {
                return this.publishImagePost(igUserId, accessToken, request.contentText, imageUrl);
            } else {
                return { success: false, message: 'Instagram requires an image or video for Graph API publishing.' };
            }
        } catch (error: any) {
            this.logger.error(`Instagram Graph API publish failed: ${error.message}`);
            return { success: false, message: `Instagram Graph API error: ${error.message}` };
        }
    }

    private async publishImagePost(
        igUserId: string,
        accessToken: string,
        caption: string,
        imageUrl: string,
    ): Promise<PublishResult> {
        // Step 1: Create media container
        const { data: containerData } = await firstValueFrom(
            this.httpService.post(
                `https://graph.facebook.com/v18.0/${igUserId}/media`,
                {
                    image_url: imageUrl,
                    caption,
                    access_token: accessToken,
                },
                { timeout: 30000 },
            ),
        );

        const containerId = containerData.id;
        if (!containerId) {
            return { success: false, message: 'Failed to create Instagram media container' };
        }

        // Step 2: Publish the container
        const { data: publishData } = await firstValueFrom(
            this.httpService.post(
                `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
                {
                    creation_id: containerId,
                    access_token: accessToken,
                },
                { timeout: 30000 },
            ),
        );

        this.logger.log(`Instagram image post published: ${publishData.id}`);
        return {
            success: true,
            message: 'Image post published to Instagram',
            platformPostId: publishData.id,
        };
    }

    private async publishReel(
        igUserId: string,
        accessToken: string,
        caption: string,
        videoUrl: string,
    ): Promise<PublishResult> {
        // Step 1: Create reel container
        const { data: containerData } = await firstValueFrom(
            this.httpService.post(
                `https://graph.facebook.com/v18.0/${igUserId}/media`,
                {
                    media_type: 'REELS',
                    video_url: videoUrl,
                    caption,
                    access_token: accessToken,
                },
                { timeout: 30000 },
            ),
        );

        const containerId = containerData.id;
        if (!containerId) {
            return { success: false, message: 'Failed to create Instagram reel container' };
        }

        // Step 2: Wait for video processing
        await this.waitForMediaProcessing(containerId, accessToken);

        // Step 3: Publish
        const { data: publishData } = await firstValueFrom(
            this.httpService.post(
                `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
                {
                    creation_id: containerId,
                    access_token: accessToken,
                },
                { timeout: 30000 },
            ),
        );

        this.logger.log(`Instagram reel published: ${publishData.id}`);
        return {
            success: true,
            message: 'Reel published to Instagram',
            platformPostId: publishData.id,
        };
    }

    private async waitForMediaProcessing(containerId: string, accessToken: string): Promise<void> {
        const maxPolls = 30;
        const intervalMs = 5000;

        for (let i = 0; i < maxPolls; i++) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));

            const { data } = await firstValueFrom(
                this.httpService.get(
                    `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`,
                    { timeout: 10000 },
                ),
            );

            if (data.status_code === 'FINISHED') return;
            if (data.status_code === 'ERROR') {
                throw new Error('Instagram media processing failed');
            }

            this.logger.debug(`Instagram media ${containerId} status: ${data.status_code} (poll ${i + 1}/${maxPolls})`);
        }

        throw new Error('Instagram media processing timed out');
    }

    /**
     * Publish via Riona (browser automation for personal accounts).
     */
    private async publishViaRiona(request: PublishRequest): Promise<PublishResult> {
        try {
            const credentials = await this.credentialsService.getCredentials(request.accountId);
            if (!credentials) {
                return { success: false, message: 'Instagram account credentials not found or expired' };
            }

            if (!this.rionaService.hasSession(credentials.username)) {
                const loginResult = await this.rionaService.login(credentials.username, credentials.password);
                if (!loginResult.success) {
                    return { success: false, message: `Instagram login failed: ${loginResult.message}` };
                }
            }

            const targetUsername = request.contentMeta?.targetUsername as string | undefined;
            if (targetUsername) {
                const dmResult = await this.rionaService.sendDm(
                    credentials.username,
                    targetUsername,
                    request.contentText,
                );
                await this.credentialsService.markUsed(request.accountId);
                return { success: dmResult.success, message: dmResult.message };
            }

            const targetUsernames = request.contentMeta?.targetUsernames as string[] | undefined;
            if (targetUsernames && targetUsernames.length > 0) {
                const bulkResult = await this.rionaService.sendBulkDm(
                    credentials.username,
                    targetUsernames,
                    request.contentText,
                );
                await this.credentialsService.markUsed(request.accountId);
                return {
                    success: bulkResult.success,
                    message: bulkResult.message,
                    metadata: { sentCount: bulkResult.sentCount },
                };
            }

            return { success: false, message: 'No target username(s) provided for Instagram DM' };
        } catch (error: any) {
            this.logger.error(`Instagram Riona publish failed: ${error.message}`);
            return { success: false, message: error.message || 'Instagram publish failed' };
        }
    }

    async validateAccount(accountId: string): Promise<AccountValidationResult> {
        const account = await this.prisma.socialAccount.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            return { valid: false, message: 'Account not found' };
        }

        if (account.connectionType === 'OAUTH') {
            const token = await this.oauthService.getValidToken(accountId);
            if (!token) {
                return { valid: false, message: 'OAuth token expired. Please reconnect.' };
            }
            return {
                valid: true,
                message: 'Instagram Business account connected via Graph API',
                accountInfo: { displayName: account.username },
            };
        }

        const credentials = await this.credentialsService.getCredentials(accountId);
        if (!credentials) {
            return { valid: false, message: 'Account credentials not found' };
        }
        return {
            valid: true,
            message: 'Instagram personal account connected via Riona',
            accountInfo: { displayName: credentials.username },
        };
    }
}
