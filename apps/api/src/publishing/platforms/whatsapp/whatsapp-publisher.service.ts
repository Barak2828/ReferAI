import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IPlatformPublisher, PublishRequest, PublishResult, AccountValidationResult } from '../platform.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { OAuthService } from '../../../oauth/oauth.service';

@Injectable()
export class WhatsAppPublisherService implements IPlatformPublisher {
    private readonly logger = new Logger(WhatsAppPublisherService.name);
    readonly platform = 'WHATSAPP';

    private readonly cloudApiBase = 'https://graph.facebook.com/v18.0';

    constructor(
        private readonly httpService: HttpService,
        private readonly prisma: PrismaService,
        private readonly oauthService: OAuthService,
    ) {}

    async publish(request: PublishRequest): Promise<PublishResult> {
        try {
            // Get token for this account (WhatsApp uses API key stored as OAuthToken)
            const token = await this.oauthService.getValidToken(request.accountId);
            if (!token) {
                return { success: false, message: 'WhatsApp account not connected. Please add your API credentials.' };
            }

            const meta = token.platformMeta ? JSON.parse(token.platformMeta) : {};
            const phoneNumberId = meta.phoneNumberId;
            if (!phoneNumberId) {
                return { success: false, message: 'No WhatsApp Phone Number ID configured.' };
            }

            const apiToken = this.oauthService.decryptToken(token.accessToken);

            // Determine recipient(s)
            const recipientNumber = request.contentMeta?.recipientNumber as string;
            const recipientNumbers = request.contentMeta?.recipientNumbers as string[] | undefined;

            if (!recipientNumber && (!recipientNumbers || recipientNumbers.length === 0)) {
                return { success: false, message: 'No recipient number(s) provided for WhatsApp message' };
            }

            const numbers = recipientNumbers || [recipientNumber];
            let sentCount = 0;
            let lastError = '';

            // Determine message type based on media content
            const imageUrl = request.contentMeta?.imageUrl as string | undefined;
            const videoUrl = request.contentMeta?.videoUrl as string | undefined;

            let messageBody: Record<string, any>;
            let timeout = 15000;

            if (imageUrl) {
                messageBody = {
                    messaging_product: 'whatsapp',
                    type: 'image',
                    image: { link: imageUrl, caption: request.contentText },
                };
                timeout = 30000;
            } else if (videoUrl) {
                messageBody = {
                    messaging_product: 'whatsapp',
                    type: 'video',
                    video: { link: videoUrl, caption: request.contentText },
                };
                timeout = 30000;
            } else {
                messageBody = {
                    messaging_product: 'whatsapp',
                    type: 'text',
                    text: { body: request.contentText },
                };
            }

            for (const number of numbers) {
                try {
                    await firstValueFrom(
                        this.httpService.post(
                            `${this.cloudApiBase}/${phoneNumberId}/messages`,
                            { ...messageBody, to: number },
                            {
                                headers: {
                                    Authorization: `Bearer ${apiToken}`,
                                    'Content-Type': 'application/json',
                                },
                                timeout,
                            },
                        ),
                    );
                    sentCount++;
                } catch (error: any) {
                    lastError = error.response?.data?.error?.message || error.message;
                    this.logger.warn(`WhatsApp send to ${number} failed: ${lastError}`);
                }
            }

            if (sentCount === 0) {
                return { success: false, message: `All WhatsApp messages failed. Last error: ${lastError}` };
            }

            return {
                success: true,
                message: `Sent to ${sentCount}/${numbers.length} recipients via WhatsApp`,
                metadata: { sentCount, totalRecipients: numbers.length },
            };
        } catch (error: any) {
            this.logger.error(`WhatsApp publish failed: ${error.message}`);
            return { success: false, message: error.message || 'WhatsApp publish failed' };
        }
    }

    async validateAccount(accountId: string): Promise<AccountValidationResult> {
        try {
            const token = await this.oauthService.getValidToken(accountId);
            if (!token) {
                return { valid: false, message: 'No WhatsApp API credentials found' };
            }

            const meta = token.platformMeta ? JSON.parse(token.platformMeta) : {};
            return {
                valid: true,
                message: 'WhatsApp Business API connected',
                accountInfo: {
                    displayName: meta.businessName || 'WhatsApp Business',
                    profileUrl: undefined,
                },
            };
        } catch (error: any) {
            return { valid: false, message: error.message || 'Failed to validate WhatsApp account' };
        }
    }
}
