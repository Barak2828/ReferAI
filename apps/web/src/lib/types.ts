// User roles matching Prisma enum
export type UserRole = 'PROVIDER' | 'PROMOTER' | 'ADMIN';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'CLOSED' | 'LOST';
export type ContentType = 'WHATSAPP_TEXT' | 'INSTAGRAM_CAPTION' | 'LINKEDIN_POST';

// Campaign type for frontend use
export interface Campaign {
    id: string;
    name: string;
    description: string;
    commission: number;
    cta: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    providerId: string;
    azugaCampaignId?: string | null;
    provider?: {
        name: string | null;
    };
}

// Form data types
export interface CampaignFormData {
    name: string;
    description: string;
    cta: string;
    commissionType: 'percentage' | 'fixed';
    commissionValue: string;
}

export interface PlatformSelection {
    whatsapp: boolean;
    instagram: boolean;
    linkedin: boolean;
    facebook: boolean;
    twitter: boolean;
    tiktok: boolean;
    email: boolean;
}

// Lead type for frontend use
export interface Lead {
    id: string;
    name: string | null;
    contact: string | null;
    status: LeadStatus;
    value: number | null;
    commission: number | null;
    campaignId: string;
    promoterId: string;
    createdAt: string;
}

// Share link type
export interface ShareLink {
    id: string;
    code: string;
    clicks: number;
    campaignId: string;
    promoterId: string;
    createdAt: string;
}

// Payout ledger type
export interface PayoutLedger {
    id: string;
    amount: number;
    status: 'PENDING' | 'PAID';
    periodStart: string;
    periodEnd: string;
    promoterId: string;
    createdAt: string;
}

// Standardized action response type
export type ActionResponse<T = void> =
    | { success: true; data?: T; error?: never }
    | { success: false; error: string; data?: never; fieldErrors?: Record<string, string[]> };
