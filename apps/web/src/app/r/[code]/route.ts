import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { code: string } }
) {
    const { code } = params
    const supabase = createClient()

    // 1. Find the share link by code
    const { data: shareLink, error } = await supabase
        .from('ShareLink')
        .select('id, clicks, campaignId')
        .eq('code', code)
        .single()

    if (error || !shareLink) {
        // Link not found — redirect to homepage
        return NextResponse.redirect(new URL('/he', request.url))
    }

    // 2. Increment click count
    await supabase
        .from('ShareLink')
        .update({ clicks: (shareLink.clicks || 0) + 1 })
        .eq('id', shareLink.id)

    // 3. Get the campaign CTA URL
    const { data: campaign } = await supabase
        .from('Campaign')
        .select('cta')
        .eq('id', shareLink.campaignId)
        .single()

    if (campaign?.cta) {
        // Redirect to the campaign's call-to-action URL
        return NextResponse.redirect(campaign.cta)
    }

    // Fallback — redirect to homepage
    return NextResponse.redirect(new URL('/he', request.url))
}
