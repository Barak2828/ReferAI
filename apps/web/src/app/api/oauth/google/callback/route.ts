import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/app/actions/social';

/**
 * Google OAuth callback handler (Google Business + YouTube).
 * Google redirects here with ?code=...&state=...
 * State contains: userId|locale|platform (GOOGLE_BUSINESS or YOUTUBE)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Parse state: userId|locale|platform
    const parts = (state || '').split('|');
    const userId = parts[0] || '';
    const locale = parts[1] || 'he';
    const platform = (parts[2] || 'GOOGLE_BUSINESS') as 'GOOGLE_BUSINESS' | 'YOUTUBE';

    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const dashboardUrl = `${baseUrl}/${locale}/dashboard/provider`;

    if (error) {
        return NextResponse.redirect(
            `${dashboardUrl}?oauth_error=${encodeURIComponent(error)}`,
        );
    }

    if (!code || !userId) {
        return NextResponse.redirect(
            `${dashboardUrl}?oauth_error=missing_params`,
        );
    }

    try {
        const redirectUri = `${baseUrl}/api/oauth/google/callback`;
        const result = await exchangeGoogleCode(code, redirectUri, userId, platform);

        const platformLabel = platform === 'YOUTUBE' ? 'youtube' : 'google_business';

        if (result.success) {
            return NextResponse.redirect(
                `${dashboardUrl}?oauth_success=${platformLabel}&account=${encodeURIComponent(result.account?.username || '')}`,
            );
        } else {
            return NextResponse.redirect(
                `${dashboardUrl}?oauth_error=${encodeURIComponent(result.message || 'exchange_failed')}`,
            );
        }
    } catch (err: any) {
        return NextResponse.redirect(
            `${dashboardUrl}?oauth_error=${encodeURIComponent(err.message || 'unknown')}`,
        );
    }
}
