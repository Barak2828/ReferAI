import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IPlatformPublisher, PublishRequest, PublishResult, AccountValidationResult } from '../platform.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { OAuthService } from '../../../oauth/oauth.service';

@Injectable()
export class GoogleBusinessPublisherService implements IPlatformPublisher {
    private readonly logger = new Logger(GoogleBusinessPublisherService.name);
    readonly platform = 'GOOGLE_BUSINESS';

    private readonly apiBase = 'https://mybusiness.googleapis.com/v4';

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly oauthService: OAuthService,
    ) {}

    async publish(request: PublishRequest): Promise<PublishResult> {
        try {
            const token = await this.oauthService.getValidToken(request.accountId);
            if (!token) {
                return { success: false, message: 'Google Business account not connected. Please reconnect.' };
            }

            const meta = token.platformMeta ? JSON.parse(token.platformMeta) : {};
            const accountId = meta.accountId;
            const locationId = meta.locationId;

            if (!accountId || !locationId) {
                return { success: false, message: 'No Google Business location configured. Please reconnect.' };
            }

            const accessToken = this.oauthService.decryptToken(token.accessToken);

            // Build local post body
            const postBody: Record<string, any> = {
                summary: request.contentText,
                topicType: 'STANDARD',
            };

            // Add image if provided
            const imageUrl = request.contentMeta?.imageUrl as string | undefined;
            if (imageUrl) {
                postBody.media = [
                    {
                        mediaFormat: 'PHOTO',
                        sourceUrl: imageUrl,
                    },
                ];
            }

            // Add CTA if provided
            const ctaUrl = request.contentMeta?.ctaUrl;
            if (ctaUrl) {
                postBody.callToAction = {
                    actionType: 'LEARN_MORE',
                    url: ctaUrl,
                };
            }

            const { data } = await firstValueFrom(
                this.httpService.post(
                    `${this.apiBase}/accounts/${accountId}/locations/${locationId}/localPosts`,
                    postBody,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        timeout: 30000,
                    },
                ),
            );

            this.logger.log(`Published to Google Business: ${data.name}`);

            return {
                success: true,
                message: 'Published to Google Business Profile successfully',
                platformPostId: data.name,
                platformUrl: data.searchUrl || undefined,
            };
        } catch (error: any) {
            const errMsg = error.response?.data?.error?.message || error.message;
            this.logger.error(`Google Business publish failed: ${errMsg}`);
            return { success: false, message: `Google Business publish failed: ${errMsg}` };
        }
    }

    async validateAccount(accountId: string): Promise<AccountValidationResult> {
        try {
            const token = await this.oauthService.getValidToken(accountId);
            if (!token) {
                return { valid: false, message: 'No valid Google Business token found' };
            }

            const meta = token.platformMeta ? JSON.parse(token.platformMeta) : {};
            return {
                valid: true,
                message: 'Google Business Profile connected',
                accountInfo: {
                    displayName: meta.locationName || meta.businessName || 'Google Business',
                },
            };
        } catch (error: any) {
            return { valid: false, message: error.message || 'Failed to validate Google Business account' };
        }
    }
}
