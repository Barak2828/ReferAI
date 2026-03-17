export type UserRole = 'PROVIDER' | 'PROMOTER' | 'ADMIN';

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    locale: 'he' | 'en';
    avatarUrl?: string;
}

export interface Campaign {
    id: string;
    name: string;
    description: string;
    commission: number;
    cta: string;
    isActive: boolean;
    azugaCampaignId?: string;
    providerId: string;
    provider?: { name: string };
    createdAt: string;
    updatedAt: string;
}

export interface CampaignFormData {
    name: string;
    description: string;
    cta: string;
    commissionType: 'percentage' | 'fixed';
    commissionValue: string;
}

export type AIProvider = 'openai' | 'anthropic';

export type Platform = 'whatsapp' | 'instagram' | 'linkedin' | 'facebook' | 'twitter' | 'tiktok' | 'email';

export interface GenerateContentParams {
    description: string;
    platforms: Platform[];
    language: 'he' | 'en';
    tone?: 'professional' | 'casual' | 'exciting';
    provider?: AIProvider;
}

export interface GenerateContentResult {
    success: boolean;
    content: Record<string, string>;
    provider?: AIProvider;
    error?: string;
}

export interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

// Re-export Riona types for convenience
export type { SocialAccount, PostLogEntry, PostStatus as PostStatusType, SocialPlatform } from '@/lib/riona/types';
