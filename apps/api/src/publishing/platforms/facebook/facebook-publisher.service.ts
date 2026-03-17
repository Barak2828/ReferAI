import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IPlatformPublisher, PublishRequest, PublishResult, AccountValidationResult } from '../platform.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { OAuthService } from '../../../oauth/oauth.service';

@Injectable()
export class FacebookPublisherService implements IPlatformPublisher {
    private readonly logger = new Logger(FacebookPublisherService.name);
    readonly platform = 'FACEBOOK';

    private readonly graphApiBase = 'https://graph.facebook.com/v18.0';

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly oauthService: OAuthService,
    ) {}

    async publish(request: PublishRequest): Promise<PublishResult> {
        try {
            // Get OAuth token for this account
            const token = await this.oauthService.getValidToken(request.accountId);
            if (!token) {
                return { success: false, message: 'Facebook account not connected or token expired. Please reconnect.' };
            }

            // Get page ID from platform meta
            const meta = token.platformMeta ? JSON.parse(token.platformMeta) : {};
            const pageId = meta.pageId;
            if (!pageId) {
                return { success: false, message: 'No Facebook Page ID configured. Please reconnect your Facebook Page.' };
            }

            // Use the page access token (stored in accessToken for page-level tokens)
            const accessToken = this.oauthService.decryptToken(token.accessToken);

            const imageUrl = request.contentMeta?.imageUrl as string | undefined;
            const videoUrl = request.contentMeta?.videoUrl as string | undefined;

            let data: any;

            if (imageUrl) {
                // Publish photo post
                const response = await firstValueFrom(
                    this.httpService.post(
                        `${this.graphApiBase}/${pageId}/photos`,
                        {
                            url: imageUrl,
                            message: request.contentText,
                            access_token: accessToken,
                        },
                        { timeout: 60000 },
                    ),
                );
                data = response.data;
                this.logger.log(`Published photo to Facebook Page ${pageId}: ${data.id}`);
            } else if (videoUrl) {
                // Publish video post
                const response = await firstValueFrom(
                    this.httpService.post(
                        `${this.graphApiBase}/${pageId}/videos`,
                        {
                            file_url: videoUrl,
                            description: request.contentText,
                            access_token: accessToken,
                        },
                        { timeout: 120000 },
                    ),
                );
                data = response.data;
                this.logger.log(`Published video to Facebook Page ${pageId}: ${data.id}`);
            } else {
                // Text-only post
                const response = await firstValueFrom(
                    this.httpService.post(
                        `${this.graphApiBase}/${pageId}/feed`,
                        {
                            message: request.contentText,
                            access_token: accessToken,
                        },
                        { timeout: 30000 },
                    ),
                );
                data = response.data;
                this.logger.log(`Published text to Facebook Page ${pageId}: ${data.id}`);
            }

            return {
                success: true,
                message: 'Published to Facebook Page successfully',
                platformPostId: data.id,
                platformUrl: `https://www.facebook.com/${data.id}`,
            };
        } catch (error: any) {
            const errMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`Facebook publish failed: ${errMsg}`);
            return { success: false, message: `Facebook publish failed: ${errMsg}` };
        }
    }

    async validateAccount(accountId: string): Promise<AccountValidationResult> {
        try {
            const token = await this.oauthService.getValidToken(accountId);
            if (!token) {
                return { valid: false, message: 'No valid OAuth token found' };
            }

            const accessToken = this.oauthService.decryptToken(token.accessToken);
            const meta = token.platformMeta ? JSON.parse(token.platformMeta) : {};

            // Verify token by fetching page info
            const { data } = await firstValueFrom(
                this.httpService.get(
                    `${this.graphApiBase}/me?access_token=${accessToken}`,
                    { timeout: 10000 },
                ),
            );

            return {
                valid: true,
                message: 'Facebook Page connected',
                accountInfo: {
                    displayName: data.name || meta.pageName,
                    pageName: meta.pageName,
                },
            };
        } catch (error: any) {
            return { valid: false, message: error.message || 'Failed to validate Facebook account' };
        }
    }
}
