'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Safely convert content value to string (email may return {subject, body} object) */
function toText(val: unknown): string {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') {
        const obj = val as Record<string, unknown>;
        if (obj.subject && obj.body) return `${obj.subject}\n\n${obj.body}`;
        return JSON.stringify(val);
    }
    return String(val ?? '');
}

interface CampaignData {
    name: string;
    description: string;
    cta: string;
    commission: number;
    providerId?: string;
    generatedContent?: Record<string, string>;
    contentLanguage?: string;
}

export async function createCampaign(data: CampaignData) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Not authenticated' }
    }

    if (!data.name || !data.description) {
        return { error: 'Missing required fields' };
    }

    // Insert campaign
    const { data: campaign, error } = await supabase
        .from('Campaign')
        .insert({
            name: data.name,
            description: data.description,
            commission: data.commission,
            cta: data.cta,
            providerId: user.id,
            isActive: true,
            updatedAt: new Date().toISOString()
        })
        .select('id')
        .single()

    if (error) {
        console.error('Campaign creation error:', error)
        return { error: error.message }
    }

    // Save generated AI content if present
    if (data.generatedContent && campaign?.id) {
        const contentTypeMap: Record<string, string> = {
            whatsapp: 'WHATSAPP_TEXT',
            instagram: 'INSTAGRAM_CAPTION',
            linkedin: 'LINKEDIN_POST',
        }

        const contentRows = Object.entries(data.generatedContent)
            .filter(([platform]) => contentTypeMap[platform])
            .map(([platform, text]) => ({
                campaignId: campaign.id,
                type: contentTypeMap[platform],
                language: data.contentLanguage || 'he',
                text: toText(text),
            }))

        if (contentRows.length > 0) {
            const { error: contentError } = await supabase
                .from('Content')
                .insert(contentRows)

            if (contentError) {
                console.error('Content save error:', contentError)
                // Don't fail the campaign creation, just log
            }
        }
    }

    revalidatePath('/dashboard/provider')
    return { success: true }
}

export async function getAvailableCampaigns() {
    const supabase = createClient()

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
        return []
    }

    return campaigns
}

// ---------- Provider Dashboard ----------

export async function getProviderCampaigns() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: campaigns, error } = await supabase
        .from('Campaign')
        .select('id, name, description, commission, cta, isActive, createdAt')
        .eq('providerId', user.id)
        .order('createdAt', { ascending: false })

    if (error) {
        console.error('Error fetching provider campaigns:', error)
        return []
    }

    // For each campaign, count leads
    const enriched = await Promise.all(
        (campaigns || []).map(async (campaign) => {
            const { count } = await supabase
                .from('Lead')
                .select('*', { count: 'exact', head: true })
                .eq('campaignId', campaign.id)

            return { ...campaign, leadCount: count || 0 }
        })
    )

    return enriched
}

export async function getProviderStats() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalLeads: 0, activePromoters: 0, pendingCommissions: 0 }

    const { data: campaigns } = await supabase
        .from('Campaign')
        .select('id')
        .eq('providerId', user.id)

    const campaignIds = (campaigns || []).map(c => c.id)

    if (campaignIds.length === 0) {
        return { totalLeads: 0, activePromoters: 0, pendingCommissions: 0 }
    }

    // Total leads across all provider campaigns
    const { count: totalLeads } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true })
        .in('campaignId', campaignIds)

    // Distinct active promoters
    const { data: shareLinks } = await supabase
        .from('ShareLink')
        .select('promoterId')
        .in('campaignId', campaignIds)

    const uniquePromoters = new Set((shareLinks || []).map(l => l.promoterId))

    // Pending commissions
    const { data: pendingLeads } = await supabase
        .from('Lead')
        .select('commission')
        .in('campaignId', campaignIds)
        .in('status', ['NEW', 'CONTACTED'])

    const pendingCommissions = (pendingLeads || []).reduce(
        (sum, l) => sum + (l.commission || 0), 0
    )

    return {
        totalLeads: totalLeads || 0,
        activePromoters: uniquePromoters.size,
        pendingCommissions,
    }
}

// ---------- Promoter Dashboard ----------

export async function getPromoterStats() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { earnings: 0, totalClicks: 0, conversions: 0 }

    // Total clicks across all share links
    const { data: shareLinks } = await supabase
        .from('ShareLink')
        .select('clicks')
        .eq('promoterId', user.id)

    const totalClicks = (shareLinks || []).reduce((sum, l) => sum + (l.clicks || 0), 0)

    // Total earnings from CLOSED leads
    const { data: closedLeads } = await supabase
        .from('Lead')
        .select('commission')
        .eq('promoterId', user.id)
        .eq('status', 'CLOSED')

    const earnings = (closedLeads || []).reduce((sum, l) => sum + (l.commission || 0), 0)

    // Conversions count
    const { count: conversions } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true })
        .eq('promoterId', user.id)
        .eq('status', 'CLOSED')

    return {
        earnings,
        totalClicks,
        conversions: conversions || 0,
    }
}

// ---------- Share Link Generation ----------

export async function generateShareLink(campaignId: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Check if link already exists
    const { data: existing } = await supabase
        .from('ShareLink')
        .select('id, code')
        .eq('campaignId', campaignId)
        .eq('promoterId', user.id)
        .single()

    if (existing) {
        return { success: true, code: existing.code, linkId: existing.id }
    }

    // Generate unique code
    const code = generateCode()

    const { data: newLink, error } = await supabase
        .from('ShareLink')
        .insert({
            code,
            campaignId,
            promoterId: user.id,
            clicks: 0,
        })
        .select('id, code')
        .single()

    if (error) {
        console.error('ShareLink creation error:', error)
        return { error: error.message }
    }

    return { success: true, code: newLink.code, linkId: newLink.id }
}

function generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// ---------- Campaign Details ----------

export async function getCampaignDetails(campaignId: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: campaign, error } = await supabase
        .from('Campaign')
        .select('*')
        .eq('id', campaignId)
        .eq('providerId', user.id)
        .single()

    if (error || !campaign) return null

    // Fetch content
    const { data: contents } = await supabase
        .from('Content')
        .select('*')
        .eq('campaignId', campaignId)
        .order('createdAt', { ascending: false })

    // Fetch leads
    const { data: leads } = await supabase
        .from('Lead')
        .select('*')
        .eq('campaignId', campaignId)
        .order('createdAt', { ascending: false })

    // Fetch share links
    const { data: shareLinks } = await supabase
        .from('ShareLink')
        .select('*')
        .eq('campaignId', campaignId)

    return {
        ...campaign,
        contents: contents || [],
        leads: leads || [],
        shareLinks: shareLinks || [],
    }
}

export async function updateCampaign(campaignId: string, data: Partial<CampaignData>) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const updateFields: Record<string, any> = { updatedAt: new Date().toISOString() }
    if (data.name !== undefined) updateFields.name = data.name
    if (data.description !== undefined) updateFields.description = data.description
    if (data.commission !== undefined) updateFields.commission = data.commission
    if (data.cta !== undefined) updateFields.cta = data.cta

    const { error } = await supabase
        .from('Campaign')
        .update(updateFields)
        .eq('id', campaignId)
        .eq('providerId', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/provider')
    return { success: true }
}

export async function deleteCampaign(campaignId: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Delete related data first (content, leads, share links)
    await supabase.from('Content').delete().eq('campaignId', campaignId)
    await supabase.from('Lead').delete().eq('campaignId', campaignId)
    await supabase.from('ShareLink').delete().eq('campaignId', campaignId)

    const { error } = await supabase
        .from('Campaign')
        .delete()
        .eq('id', campaignId)
        .eq('providerId', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/provider')
    return { success: true }
}

export async function toggleCampaignActive(campaignId: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Get current state
    const { data: campaign } = await supabase
        .from('Campaign')
        .select('isActive')
        .eq('id', campaignId)
        .eq('providerId', user.id)
        .single()

    if (!campaign) return { error: 'Campaign not found' }

    const { error } = await supabase
        .from('Campaign')
        .update({ isActive: !campaign.isActive, updatedAt: new Date().toISOString() })
        .eq('id', campaignId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/provider')
    return { success: true, isActive: !campaign.isActive }
}

// ─── Lead Management ────────────────────────────────────────

export async function updateLeadStatus(
    leadId: string,
    status: 'NEW' | 'CONTACTED' | 'CLOSED' | 'LOST',
    notes?: string,
) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const updateData: Record<string, any> = { status }
    if (notes !== undefined) updateData.notes = notes

    const { error } = await supabase
        .from('Lead')
        .update(updateData)
        .eq('id', leadId)

    if (error) return { error: error.message }
    return { success: true }
}
