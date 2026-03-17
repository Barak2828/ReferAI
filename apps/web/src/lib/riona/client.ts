/**
 * HTTP client for the NestJS API proxy.
 * Used by server actions — never called directly from client components.
 */

import type {
    RionaStatus,
    RionaActionResult,
    RionaDmResult,
    RionaScrapeResult,
    SocialAccount,
    SocialPlatform,
    PublishResult,
    PublishJobEntry,
    OAuthUrlResult,
    VideoGenerationResult,
} from './types';

const API_BASE = process.env.NESTJS_API_URL || 'http://localhost:3001';

async function rionaFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data as T;
}

// ─── Riona / Instagram ────────────────────────────────────────

export async function getRionaStatus(): Promise<RionaStatus> {
    try {
        return await rionaFetch<RionaStatus>('/riona/status');
    } catch {
        return { serverReachable: false, dbConnected: false };
    }
}

export async function loginInstagram(
    username: string,
    password: string,
): Promise<RionaActionResult> {
    return rionaFetch<RionaActionResult>('/riona/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
}

export async function sendDm(
    sessionUsername: string,
    targetUsername: string,
    message: string,
): Promise<RionaActionResult> {
    return rionaFetch<RionaActionResult>('/riona/dm', {
        method: 'POST',
        body: JSON.stringify({ sessionUsername, targetUsername, message }),
    });
}

export async function sendBulkDm(
    sessionUsername: string,
    targetUsernames: string[],
    message: string,
): Promise<RionaDmResult> {
    return rionaFetch<RionaDmResult>('/riona/dm/bulk', {
        method: 'POST',
        body: JSON.stringify({ sessionUsername, targetUsernames, message }),
    });
}

export async function interactWithPosts(
    sessionUsername: string,
): Promise<RionaActionResult> {
    return rionaFetch<RionaActionResult>('/riona/interact', {
        method: 'POST',
        body: JSON.stringify({ sessionUsername }),
    });
}

export async function scrapeFollowers(
    sessionUsername: string,
    targetAccount: string,
    maxFollowers: number = 100,
): Promise<RionaScrapeResult> {
    return rionaFetch<RionaScrapeResult>('/riona/scrape-followers', {
        method: 'POST',
        body: JSON.stringify({ sessionUsername, targetAccount, maxFollowers }),
    });
}

// ─── Social Account Management ────────────────────────────────

export async function linkSocialAccount(
    userId: string,
    platform: SocialPlatform,
    username: string,
    password: string,
): Promise<{ success: boolean; account: SocialAccount }> {
    return rionaFetch('/social-credentials/link', {
        method: 'POST',
        body: JSON.stringify({ userId, platform, username, password }),
    });
}

export async function getLinkedAccounts(
    userId: string,
): Promise<{ success: boolean; accounts: SocialAccount[] }> {
    return rionaFetch(`/social-credentials/accounts?userId=${encodeURIComponent(userId)}`);
}

export async function unlinkSocialAccount(
    accountId: string,
    userId: string,
): Promise<{ success: boolean }> {
    return rionaFetch(`/social-credentials/${accountId}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
    });
}

// ─── Multi-Platform Publishing ────────────────────────────────

export async function publishContent(
    platform: SocialPlatform,
    accountId: string,
    campaignId: string,
    contentText: string,
    contentMeta?: Record<string, any>,
): Promise<{ jobId: string; result: PublishResult }> {
    return rionaFetch('/publishing/publish', {
        method: 'POST',
        body: JSON.stringify({ platform, accountId, campaignId, contentText, contentMeta }),
    });
}

export async function publishToAll(
    campaignId: string,
    platforms: Array<{
        platform: SocialPlatform;
        accountId: string;
        contentText: string;
        contentMeta?: Record<string, any>;
    }>,
): Promise<{
    results: Array<{ platform: string; jobId: string; result: PublishResult }>;
}> {
    return rionaFetch('/publishing/publish-all', {
        method: 'POST',
        body: JSON.stringify({ campaignId, platforms }),
    });
}

export async function getPublishJobStatus(
    jobId: string,
): Promise<{ success: boolean; job: PublishJobEntry }> {
    return rionaFetch(`/publishing/status/${jobId}`);
}

export async function getCampaignPublishJobs(
    campaignId: string,
): Promise<{ success: boolean; jobs: PublishJobEntry[] }> {
    return rionaFetch(`/publishing/campaign/${campaignId}/jobs`);
}

export async function retryPublishJob(
    jobId: string,
): Promise<{ jobId: string; result: PublishResult }> {
    return rionaFetch(`/publishing/retry/${jobId}`, { method: 'POST' });
}

export async function getAvailablePlatforms(): Promise<{ platforms: string[] }> {
    return rionaFetch('/publishing/platforms');
}

// ─── OAuth ────────────────────────────────────────────────────

export async function getFacebookAuthUrl(
    redirectUri: string,
    state: string,
): Promise<OAuthUrlResult> {
    return rionaFetch(
        `/oauth/facebook/auth-url?redirectUri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    );
}

export async function exchangeFacebookCode(
    code: string,
    redirectUri: string,
    userId: string,
    selectedPageId?: string,
): Promise<{ success: boolean; account?: SocialAccount; pages?: Array<{ id: string; name: string }>; message?: string }> {
    return rionaFetch('/oauth/facebook/exchange', {
        method: 'POST',
        body: JSON.stringify({ code, redirectUri, userId, selectedPageId }),
    });
}

export async function getGoogleAuthUrl(
    redirectUri: string,
    state: string,
    type: 'business' | 'youtube',
): Promise<OAuthUrlResult> {
    return rionaFetch(
        `/oauth/google/auth-url?redirectUri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&type=${type}`,
    );
}

export async function exchangeGoogleCode(
    code: string,
    redirectUri: string,
    userId: string,
    platform: 'GOOGLE_BUSINESS' | 'YOUTUBE',
    platformMeta?: Record<string, any>,
): Promise<{ success: boolean; account?: SocialAccount; message?: string }> {
    return rionaFetch('/oauth/google/exchange', {
        method: 'POST',
        body: JSON.stringify({ code, redirectUri, userId, platform, platformMeta }),
    });
}

export async function getInstagramAuthUrl(
    redirectUri: string,
    state: string,
): Promise<OAuthUrlResult> {
    return rionaFetch(
        `/oauth/instagram/auth-url?redirectUri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    );
}

export async function exchangeInstagramCode(
    code: string,
    redirectUri: string,
    userId: string,
): Promise<{ success: boolean; account?: SocialAccount; message?: string }> {
    return rionaFetch('/oauth/instagram/exchange', {
        method: 'POST',
        body: JSON.stringify({ code, redirectUri, userId }),
    });
}

export async function connectWhatsApp(
    userId: string,
    apiToken: string,
    phoneNumberId: string,
    businessName: string,
): Promise<{ success: boolean; account?: SocialAccount; message?: string }> {
    return rionaFetch('/oauth/whatsapp/connect', {
        method: 'POST',
        body: JSON.stringify({ userId, apiToken, phoneNumberId, businessName }),
    });
}

// ─── Video Generation (YouTube / HeyGen) ─────────────────────

export async function generateAIVideo(
    text: string,
    language?: string,
): Promise<VideoGenerationResult> {
    return rionaFetch('/publishing/youtube/generate-video', {
        method: 'POST',
        body: JSON.stringify({ text, language }),
    });
}

// ─── AI Media Generation (Stability AI / Kling AI) ───────────

export interface MediaAssetResult {
    id: string;
    url: string;
    type: 'image' | 'video';
    provider: string;
    prompt: string;
    metadata?: Record<string, any>;
}

export interface MediaGenerationResult {
    success: boolean;
    assets: MediaAssetResult[];
    error?: string;
}

export async function generateAIImage(
    prompt: string,
    options?: {
        aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
        negativePrompt?: string;
        style?: string;
        campaignId?: string;
        variants?: number;
    },
): Promise<MediaGenerationResult> {
    return rionaFetch('/ai-media/generate-image', {
        method: 'POST',
        body: JSON.stringify({ prompt, ...options }),
    });
}

export async function generateAIVideoKling(
    prompt: string,
    options?: {
        aspectRatio?: '16:9' | '9:16' | '1:1';
        duration?: 5 | 10;
        negativePrompt?: string;
        campaignId?: string;
    },
): Promise<MediaGenerationResult> {
    return rionaFetch('/ai-media/generate-video', {
        method: 'POST',
        body: JSON.stringify({ prompt, ...options }),
    });
}

export async function getMediaProviders(): Promise<{
    image: Record<string, boolean>;
    video: Record<string, boolean>;
}> {
    return rionaFetch('/ai-media/providers');
}

export async function getCampaignMediaAssets(campaignId: string): Promise<MediaAssetResult[]> {
    return rionaFetch(`/ai-media/campaign/${campaignId}/assets`);
}

// ─── Content Intelligence (Smart Prompts) ────────────────────

export interface PromptVariant {
    label: string;
    description: string;
    textPrompt: string;
    imagePrompt: string;
    videoPrompt: string;
}

export interface SmartPromptResult {
    success: boolean;
    channelAnalysis: Array<{
        platform: string;
        youtube?: Record<string, any>;
        instagram?: Record<string, any>;
    }>;
    variants: PromptVariant[];
}

export async function analyzeChannel(
    userId: string,
    platform: string,
): Promise<{ success: boolean; analysis?: Record<string, any>; error?: string }> {
    return rionaFetch('/content-intelligence/analyze-channel', {
        method: 'POST',
        body: JSON.stringify({ userId, platform }),
    });
}

export async function generateSmartPrompts(
    userId: string,
    campaignDescription: string,
    campaignName: string,
    targetPlatform: string,
    language?: string,
): Promise<SmartPromptResult> {
    return rionaFetch('/content-intelligence/generate-prompts', {
        method: 'POST',
        body: JSON.stringify({ userId, campaignDescription, campaignName, targetPlatform, language }),
    });
}
