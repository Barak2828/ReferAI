'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, requireRole } from '@/lib/auth-guard'

interface CampaignData {
    name: string;
    description: string;
    cta: string;
    commission: number;
}

export async function createCampaign(data: CampaignData) {
    // 1. Require PROVIDER or ADMIN role
    const auth = await requireRole(['PROVIDER', 'ADMIN'])
    if (auth.error) {
        return { success: false, error: auth.error }
    }

    // 2. Validate data
    if (!data.name || data.name.length < 3) {
        return { success: false, error: 'Campaign name must be at least 3 characters' }
    }
    if (!data.description || data.description.length < 10) {
        return { success: false, error: 'Description must be at least 10 characters' }
    }
    if (data.commission === undefined || data.commission < 0) {
        return { success: false, error: 'Commission must be a positive number' }
    }

    // 3. Insert into DB
    const supabase = createClient()
    try {
        const { error } = await supabase
            .from('Campaign')
            .insert({
                name: data.name,
                description: data.description,
                commission: data.commission,
                cta: data.cta || '',
                providerId: auth.user.id,
                isActive: true,
                updatedAt: new Date().toISOString()
            })

        if (error) {
            console.error('Campaign creation error:', error)
            return { success: false, error: 'Failed to create campaign. Please try again.' }
        }

        revalidatePath('/dashboard/provider')
        return { success: true }
    } catch (err) {
        console.error('Campaign creation exception:', err)
        return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
}

export async function getAvailableCampaigns() {
    // Require authentication
    const auth = await requireAuth()
    if (auth.error) {
        return { success: false, error: auth.error, campaigns: [] }
    }

    const supabase = createClient()
    try {
        const { data: campaigns, error } = await supabase
            .from('Campaign')
            .select(`
                *,
                provider:providerId (
                    name
                )
            `)
            .eq('isActive', true)
            .order('createdAt', { ascending: false })

        if (error) {
            console.error('Error fetching campaigns:', error)
            return { success: false, error: 'Failed to load campaigns. Please try again.', campaigns: [] }
        }

        return { success: true, campaigns: campaigns || [] }
    } catch (err) {
        console.error('Campaign fetch exception:', err)
        return { success: false, error: 'An unexpected error occurred.', campaigns: [] }
    }
}
