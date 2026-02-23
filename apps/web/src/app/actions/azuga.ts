'use server'

import { createClient } from '@/lib/supabase/server'
import { fetchMockAzugaCampaigns } from '@/lib/azuga-mock'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth-guard'

export async function syncAzugaCampaigns() {
    // Only providers and admins can sync from CRM
    const auth = await requireRole(['PROVIDER', 'ADMIN'])
    if (auth.error) {
        return { success: false, error: auth.error, count: 0 }
    }

    const supabase = createClient()

    try {
        // Fetch from "Azuga API" (mock for pilot)
        const azugaCampaigns = await fetchMockAzugaCampaigns();

        // Upsert into Supabase
        let count = 0;
        for (const campaign of azugaCampaigns) {
            // Check if already synced
            const { data: existing } = await supabase
                .from('Campaign')
                .select('id')
                .eq('azugaCampaignId', campaign.id)
                .single()

            if (!existing) {
                const { error } = await supabase.from('Campaign').insert({
                    name: `[Azuga] ${campaign.name}`,
                    description: campaign.description,
                    commission: campaign.payout_amount,
                    cta: campaign.landing_url,
                    azugaCampaignId: campaign.id,
                    providerId: auth.user.id,
                    isActive: true
                })

                if (error) {
                    console.error('Azuga campaign insert error:', error)
                    continue
                }
                count++;
            }
        }

        revalidatePath('/dashboard/provider')
        return { success: true, count }
    } catch (err) {
        console.error('Azuga sync exception:', err)
        return { success: false, error: 'Failed to sync from Azuga CRM. Please try again.', count: 0 }
    }
}
