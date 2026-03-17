import { NextRequest, NextResponse } from 'next/server';
import { exchangeFacebookCode } from '@/app/actions/social';

/**
 * Facebook OAuth callback handler.
 * Facebook redirects here with ?code=...&state=...
 * State contains: userId|locale
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Parse state: userId|locale
    const [userId, locale = 'he'] = (state || '').split('|');

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
        const redirectUri = `${baseUrl}/api/oauth/facebook/callback`;
        const result = await exchangeFacebookCode(code, redirectUri, userId);

        if (result.success) {
            return NextResponse.redirect(
                `${dashboardUrl}?oauth_success=facebook&account=${encodeURIComponent(result.account?.username || '')}`,
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
