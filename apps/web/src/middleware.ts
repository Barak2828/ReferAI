import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';

const locales = ['en', 'he'];
const defaultLocale = 'he';

export async function middleware(request: NextRequest) {
    const handleI18n = createMiddleware({
        locales,
        defaultLocale,
    });

    const response = handleI18n(request);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Determine locale from the pathname
    const pathname = request.nextUrl.pathname;
    const pathnameLocale = locales.find(
        (loc) => pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`
    ) || defaultLocale;

    const isDashboardRoute = pathname.includes('/dashboard');
    const isLoginRoute = pathname.includes('/login');
    const isSignupRoute = pathname.includes('/signup');

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (supabaseUrl && supabaseKey && !isDemoMode) {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set(name, value)
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        // Auth guard: redirect unauthenticated users away from dashboard
        if (isDashboardRoute && !user) {
            const loginUrl = new URL(`/${pathnameLocale}/login`, request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Redirect authenticated users away from login/signup pages to dashboard
        if ((isLoginRoute || isSignupRoute) && user) {
            const dashboardUrl = new URL(`/${pathnameLocale}/dashboard/provider`, request.url);
            return NextResponse.redirect(dashboardUrl);
        }
    }

    return response
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    // - … the `/r/` redirect paths (for share link tracking)
    matcher: ['/((?!api|_next|_vercel|r/|auth/|.*\\..*).*)']
};
