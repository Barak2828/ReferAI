'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchMockAzugaCampaigns } from '@/lib/azuga-mock'
import { revalidatePath } from 'next/cache'

export async function syncAzugaCampaigns() {
    const supabase = createClient()

    // 1. Get current user (Provider)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Not authenticated' }
    }

    // 2. Fetch from "Azuga API"
    const azugaCampaigns = await fetchMockAzugaCampaigns();

    // 3. Upsert into Supabase
    let count = 0;
    for (const campaign of azugaCampaigns) {
        // Check if exists
        const { data: existing } = await supabase
            .from('Campaign')
            .select('id')
            .eq('azugaCampaignId', campaign.id)
            .single()

        if (!existing) {
            // Create new
            await supabase.from('Campaign').insert({
                name: `[Azuga] ${campaign.name}`,
                description: campaign.description,
                commission: campaign.payout_amount,
                // Note: we might want to store 'type' somewhere, but schema currently only has float commission
                cta: campaign.landing_url,
                azugaCampaignId: campaign.id,
                providerId: user.id,
                isActive: true
            })
            count++;
        }
    }

    revalidatePath('/dashboard/provider')
    return { success: true, count }
}
