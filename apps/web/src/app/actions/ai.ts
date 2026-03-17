'use server'

import { generateContent, analyzeLeads } from '@/lib/ai';
import type { GenerateContentParams, GenerateContentResult, AIProvider } from '@/types';

export async function generateCampaignContent(
    data: { description: string; platforms: string[]; language: string; provider?: AIProvider }
): Promise<GenerateContentResult> {
    try {
        const result = await generateContent({
            description: data.description,
            platforms: data.platforms as GenerateContentParams['platforms'],
            language: data.language as 'he' | 'en',
            provider: data.provider,
        });
        return result;
    } catch (error) {
        console.error('AI generation error:', error);
        return {
            success: false,
            content: {},
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function analyzeCampaignLeads(
    campaignDescription: string,
    leads: Array<Record<string, unknown>>
): Promise<{ success: boolean; analysis?: string; error?: string }> {
    try {
        const analysis = await analyzeLeads(leads, campaignDescription);
        return { success: true, analysis };
    } catch (error) {
        console.error('Lead analysis error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// ─── AI Media Generation ─────────────────────────────────────

import {
    generateAIImage,
    generateAIVideoKling,
    getMediaProviders,
    analyzeChannel,
    generateSmartPrompts,
    type MediaGenerationResult,
    type SmartPromptResult,
} from '@/lib/riona/client';

export async function generateCampaignImage(data: {
    prompt: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    style?: string;
    campaignId?: string;
    variants?: number;
}): Promise<MediaGenerationResult> {
    try {
        return await generateAIImage(data.prompt, {
            aspectRatio: data.aspectRatio,
            style: data.style,
            campaignId: data.campaignId,
            variants: data.variants,
        });
    } catch (error) {
        console.error('Image generation error:', error);
        return {
            success: false,
            assets: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function generateCampaignVideo(data: {
    prompt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: 5 | 10;
    campaignId?: string;
}): Promise<MediaGenerationResult> {
    try {
        return await generateAIVideoKling(data.prompt, {
            aspectRatio: data.aspectRatio,
            duration: data.duration,
            campaignId: data.campaignId,
        });
    } catch (error) {
        console.error('Video generation error:', error);
        return {
            success: false,
            assets: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function getAIMediaProviders() {
    try {
        return await getMediaProviders();
    } catch {
        return { image: {}, video: {} };
    }
}

export async function analyzeUserChannel(
    userId: string,
    platform: string,
): Promise<{ success: boolean; analysis?: Record<string, any>; error?: string }> {
    try {
        return await analyzeChannel(userId, platform);
    } catch (error) {
        console.error('Channel analysis error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

export async function getSmartPrompts(data: {
    userId: string;
    campaignDescription: string;
    campaignName: string;
    targetPlatform: string;
    language?: string;
}): Promise<SmartPromptResult> {
    try {
        return await generateSmartPrompts(
            data.userId,
            data.campaignDescription,
            data.campaignName,
            data.targetPlatform,
            data.language,
        );
    } catch (error) {
        console.error('Smart prompts error:', error);
        return {
            success: false,
            channelAnalysis: [],
            variants: [],
        };
    }
}
