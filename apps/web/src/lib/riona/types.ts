export type SocialPlatform =
    | 'INSTAGRAM'
    | 'TWITTER'
    | 'FACEBOOK'
    | 'WHATSAPP'
    | 'YOUTUBE'
    | 'GOOGLE_BUSINESS'
    | 'LINKEDIN';

export type ConnectionType = 'CREDENTIALS' | 'OAUTH' | 'API_KEY';

export type PostStatus = 'PENDING' | 'POSTING' | 'POSTED' | 'FAILED';

export type PublishJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';

export interface SocialAccount {
    id: string;
    platform: SocialPlatform;
    username: string;
    connectionType?: ConnectionType;
    isActive: boolean;
    lastUsedAt: string | null;
}

export interface RionaStatus {
    serverReachable: boolean;
    dbConnected: boolean;
}

export interface RionaActionResult {
    success: boolean;
    message: string;
}

export interface RionaDmResult extends RionaActionResult {
    sentCount?: number;
}

export interface RionaScrapeResult {
    success: boolean;
    followers: string[];
}

export interface PostLogEntry {
    id: string;
    status: PostStatus;
    platform: SocialPlatform;
    contentText: string;
    errorMsg: string | null;
    postedAt: string | null;
    campaignId: string;
    accountId: string;
}

export interface PublishResult {
    success: boolean;
    message: string;
    platformPostId?: string;
    platformUrl?: string;
    metadata?: Record<string, any>;
}

export interface PublishJobEntry {
    id: string;
    status: PublishJobStatus;
    platform: SocialPlatform;
    contentText: string;
    errorMsg: string | null;
    retryCount: number;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    account?: {
        id: string;
        username: string;
        platform: SocialPlatform;
    };
}

export interface OAuthUrlResult {
    url: string;
}

export interface VideoGenerationResult {
    success: boolean;
    videoUrl?: string;
    videoId?: string;
    thumbnailUrl?: string;
    error?: string;
}
