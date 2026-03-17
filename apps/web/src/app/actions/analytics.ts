'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProviderAnalytics() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get provider's campaigns
    const { data: campaigns } = await supabase
        .from('Campaign')
        .select('id, name')
        .eq('providerId', user.id)

    const campaignIds = (campaigns || []).map(c => c.id)

    if (campaignIds.length === 0) {
        return {
            totalLeads: 0,
            totalClicks: 0,
            totalRevenue: 0,
            conversionRate: 0,
            campaignCount: 0,
            topPromoters: [],
            campaignBreakdown: [],
        }
    }

    // Total leads
    const { count: totalLeads } = await supabase
        .from('Lead')
        .select('*', { count: 'exact', head: true })
        .in('campaignId', campaignIds)

    // Closed leads (conversions) and revenue
    const { data: closedLeads } = await supabase
        .from('Lead')
        .select('value, commission')
        .in('campaignId', campaignIds)
        .eq('status', 'CLOSED')

    const totalRevenue = (closedLeads || []).reduce((sum, l) => sum + (l.value || 0), 0)
    const conversions = closedLeads?.length || 0

    // Total clicks from share links
    const { data: shareLinks } = await supabase
        .from('ShareLink')
        .select('clicks, promoterId')
        .in('campaignId', campaignIds)

    const totalClicks = (shareLinks || []).reduce((sum, l) => sum + (l.clicks || 0), 0)

    // Conversion rate
    const conversionRate = totalClicks > 0 ? Math.round((conversions / totalClicks) * 100) : 0

    // Top promoters by lead count
    const { data: allLeads } = await supabase
        .from('Lead')
        .select('promoterId')
        .in('campaignId', campaignIds)

    const promoterLeadCounts: Record<string, number> = {}
    for (const lead of allLeads || []) {
        promoterLeadCounts[lead.promoterId] = (promoterLeadCounts[lead.promoterId] || 0) + 1
    }

    // Get promoter names for top ones
    const promoterIds = Object.keys(promoterLeadCounts)
    let topPromoters: { id: string; name: string; leads: number; clicks: number }[] = []

    if (promoterIds.length > 0) {
        const { data: promoterUsers } = await supabase
            .from('User')
            .select('id, name, email')
            .in('id', promoterIds)

        // Calculate clicks per promoter
        const promoterClickCounts: Record<string, number> = {}
        for (const link of shareLinks || []) {
            promoterClickCounts[link.promoterId] = (promoterClickCounts[link.promoterId] || 0) + (link.clicks || 0)
        }

        topPromoters = (promoterUsers || [])
            .map(u => ({
                id: u.id,
                name: u.name || u.email || 'Unknown',
                leads: promoterLeadCounts[u.id] || 0,
                clicks: promoterClickCounts[u.id] || 0,
            }))
            .sort((a, b) => b.leads - a.leads)
            .slice(0, 10)
    }

    // Campaign breakdown
    const campaignBreakdown = await Promise.all(
        (campaigns || []).map(async (campaign) => {
            const { count: leads } = await supabase
                .from('Lead')
                .select('*', { count: 'exact', head: true })
                .eq('campaignId', campaign.id)

            const { data: links } = await supabase
                .from('ShareLink')
                .select('clicks')
                .eq('campaignId', campaign.id)

            const clicks = (links || []).reduce((sum, l) => sum + (l.clicks || 0), 0)

            return {
                id: campaign.id,
                name: campaign.name,
                leads: leads || 0,
                clicks,
            }
        })
    )

    return {
        totalLeads: totalLeads || 0,
        totalClicks,
        totalRevenue,
        conversionRate,
        campaignCount: campaigns?.length || 0,
        topPromoters,
        campaignBreakdown,
    }
}
