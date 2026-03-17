/**
 * IPlatformPublisher — unified interface for all platform publishers.
 * Each platform (Facebook, WhatsApp, YouTube, Google Business, Instagram)
 * implements this interface as a NestJS injectable service.
 */
export interface PublishRequest {
    accountId: string;
    campaignId: string;
    contentText: string;
    contentMeta?: Record<string, any>; // { videoUrl, thumbnailUrl, mediaType, cta, etc. }
}

export interface PublishResult {
    success: boolean;
    message: string;
    platformPostId?: string; // External ID from the platform
    platformUrl?: string;    // URL to the published post
    metadata?: Record<string, any>;
}

export interface AccountValidationResult {
    valid: boolean;
    message: string;
    accountInfo?: {
        displayName?: string;
        profileUrl?: string;
        pageName?: string;
    };
}

export interface IPlatformPublisher {
    /**
     * Platform identifier matching SocialPlatform enum.
     */
    readonly platform: string;

    /**
     * Publish content to this platform.
     */
    publish(request: PublishRequest): Promise<PublishResult>;

    /**
     * Validate that the account credentials/tokens are still valid.
     */
    validateAccount(accountId: string): Promise<AccountValidationResult>;
}
