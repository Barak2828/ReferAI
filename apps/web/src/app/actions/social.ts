'use server';

import * as riona from '@/lib/riona/client';
import type {
    RionaStatus,
    RionaActionResult,
    SocialAccount,
    SocialPlatform,
    PublishResult,
    PublishJobEntry,
    VideoGenerationResult,
} from '@/lib/riona/types';

// ─── Riona / Instagram ────────────────────────────────────────

export async function getRionaStatus(): Promise<RionaStatus> {
    return riona.getRionaStatus();
}

export async function loginInstagram(
    username: string,
    password: string,
): Promise<RionaActionResult> {
    try {
        return await riona.loginInstagram(username, password);
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to login to Instagram' };
    }
}

export async function sendCampaignDm(
    sessionUsername: string,
    targetUsername: string,
    message: string,
): Promise<RionaActionResult> {
    try {
        return await riona.sendDm(sessionUsername, targetUsername, message);
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to send DM' };
    }
}

export async function sendCampaignBulkDm(
    sessionUsername: string,
    targetUsernames: string[],
    message: string,
): Promise<RionaActionResult & { sentCount?: number }> {
    try {
        return await riona.sendBulkDm(sessionUsername, targetUsernames, message);
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to send bulk DMs' };
    }
}

export async function interactWithPosts(
    sessionUsername: string,
): Promise<RionaActionResult> {
    try {
        return await riona.interactWithPosts(sessionUsername);
    } catch (error: any) {
        return { success: false, message: error.message || 'Interaction failed' };
    }
}

export async function scrapeFollowers(
    sessionUsername: string,
    targetAccount: string,
    maxFollowers: number = 100,
): Promise<{ success: boolean; followers: string[] }> {
    try {
        return await riona.scrapeFollowers(sessionUsername, targetAccount, maxFollowers);
    } catch {
        return { success: false, followers: [] };
    }
}

// ─── Social Account Management ────────────────────────────────

export async function linkSocialAccount(
    userId: string,
    platform: SocialPlatform,
    username: string,
    password: string,
): Promise<{ success: boolean; account?: SocialAccount; error?: string }> {
    try {
        const result = await riona.linkSocialAccount(userId, platform, username, password);
        return { success: true, account: result.account };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to link account' };
    }
}

export async function getLinkedAccounts(
    userId: string,
): Promise<{ success: boolean; accounts: SocialAccount[] }> {
    try {
        return await riona.getLinkedAccounts(userId);
    } catch {
        return { success: false, accounts: [] };
    }
}

export async function unlinkSocialAccount(
    accountId: string,
    userId: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        await riona.unlinkSocialAccount(accountId, userId);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to unlink account' };
    }
}

// ─── Multi-Platform Publishing ────────────────────────────────

export async function publishToPlatform(
    platform: SocialPlatform,
    accountId: string,
    campaignId: string,
    contentText: string,
    contentMeta?: Record<string, any>,
): Promise<{ success: boolean; jobId?: string; result?: PublishResult; error?: string }> {
    try {
        const response = await riona.publishContent(platform, accountId, campaignId, contentText, contentMeta);
        return { success: response.result.success, jobId: response.jobId, result: response.result };
    } catch (error: any) {
        return { success: false, error: error.message || 'Publishing failed' };
    }
}

export async function publishToAllPlatforms(
    campaignId: string,
    platforms: Array<{
        platform: SocialPlatform;
        accountId: string;
        contentText: string;
        contentMeta?: Record<string, any>;
    }>,
): Promise<{
    success: boolean;
    results?: Array<{ platform: string; jobId: string; result: PublishResult }>;
    error?: string;
}> {
    try {
        const response = await riona.publishToAll(campaignId, platforms);
        return { success: true, results: response.results };
    } catch (error: any) {
        return { success: false, error: error.message || 'Bulk publishing failed' };
    }
}

export async function getPublishJobStatus(
    jobId: string,
): Promise<{ success: boolean; job?: PublishJobEntry; error?: string }> {
    try {
        return await riona.getPublishJobStatus(jobId);
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCampaignPublishJobs(
    campaignId: string,
): Promise<{ success: boolean; jobs: PublishJobEntry[] }> {
    try {
        return await riona.getCampaignPublishJobs(campaignId);
    } catch {
        return { success: false, jobs: [] };
    }
}

export async function retryPublishJob(
    jobId: string,
): Promise<{ success: boolean; result?: PublishResult; error?: string }> {
    try {
        const response = await riona.retryPublishJob(jobId);
        return { success: response.result.success, result: response.result };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ─── OAuth Connections ────────────────────────────────────────

export async function getFacebookAuthUrl(
    redirectUri: string,
    state: string,
): Promise<{ url: string }> {
    try {
        return await riona.getFacebookAuthUrl(redirectUri, state);
    } catch {
        return { url: '' };
    }
}

export async function exchangeFacebookCode(
    code: string,
    redirectUri: string,
    userId: string,
    selectedPageId?: string,
): Promise<{ success: boolean; account?: SocialAccount; pages?: Array<{ id: string; name: string }>; message?: string }> {
    try {
        return await riona.exchangeFacebookCode(code, redirectUri, userId, selectedPageId);
    } catch (error: any) {
        return { success: false, message: error.message || 'Facebook connection failed' };
    }
}

export async function getGoogleAuthUrl(
    redirectUri: string,
    state: string,
    type: 'business' | 'youtube',
): Promise<{ url: string }> {
    try {
        return await riona.getGoogleAuthUrl(redirectUri, state, type);
    } catch {
        return { url: '' };
    }
}

export async function exchangeGoogleCode(
    code: string,
    redirectUri: string,
    userId: string,
    platform: 'GOOGLE_BUSINESS' | 'YOUTUBE',
    platformMeta?: Record<string, any>,
): Promise<{ success: boolean; account?: SocialAccount; message?: string }> {
    try {
        return await riona.exchangeGoogleCode(code, redirectUri, userId, platform, platformMeta);
    } catch (error: any) {
        return { success: false, message: error.message || 'Google connection failed' };
    }
}

export async function getInstagramAuthUrl(
    redirectUri: string,
    state: string,
): Promise<{ url: string }> {
    try {
        return await riona.getInstagramAuthUrl(redirectUri, state);
    } catch {
        return { url: '' };
    }
}

export async function exchangeInstagramCode(
    code: string,
    redirectUri: string,
    userId: string,
): Promise<{ success: boolean; account?: SocialAccount; message?: string }> {
    try {
        return await riona.exchangeInstagramCode(code, redirectUri, userId);
    } catch (error: any) {
        return { success: false, message: error.message || 'Instagram connection failed' };
    }
}

export async function connectWhatsApp(
    userId: string,
    apiToken: string,
    phoneNumberId: string,
    businessName: string,
): Promise<{ success: boolean; account?: SocialAccount; message?: string }> {
    try {
        return await riona.connectWhatsApp(userId, apiToken, phoneNumberId, businessName);
    } catch (error: any) {
        return { success: false, message: error.message || 'WhatsApp connection failed' };
    }
}

// ─── AI Video Generation ──────────────────────────────────────

export async function generateAIVideo(
    text: string,
    language?: string,
): Promise<VideoGenerationResult> {
    try {
        return await riona.generateAIVideo(text, language);
    } catch (error: any) {
        return { success: false, error: error.message || 'Video generation failed' };
    }
}
