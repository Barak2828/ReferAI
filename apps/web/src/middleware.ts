import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware';

const SUPPORTED_LOCALES = ['en', 'he'] as const;
const DEFAULT_LOCALE = 'he';

export async function middleware(request: NextRequest) {
    const handleI18n = createMiddleware({
        locales: [...SUPPORTED_LOCALES],
        defaultLocale: DEFAULT_LOCALE
    });

    const response = handleI18n(request);

    // Skip auth checks if Supabase env vars are not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return response;
    }

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

    const pathname = request.nextUrl.pathname
    // Extract locale from path (first segment)
    const pathLocale = pathname.split('/')[1]
    const locale = SUPPORTED_LOCALES.includes(pathLocale as typeof SUPPORTED_LOCALES[number])
        ? pathLocale
        : DEFAULT_LOCALE

    const isProtectedRoute = pathname.includes('/dashboard')
    const isLoginPage = pathname.includes('/login')

    // Redirect unauthenticated users away from protected routes
    if (isProtectedRoute && !user) {
        const loginUrl = new URL(`/${locale}/login`, request.url)
        const redirectResponse = NextResponse.redirect(loginUrl)
        // Transfer i18n cookies to redirect response
        response.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    // Redirect authenticated users away from login page
    if (isLoginPage && user) {
        const role = (user.user_metadata?.role as string)?.toUpperCase()
        const dashboardPath = role === 'PROMOTER'
            ? `/${locale}/dashboard/promoter`
            : `/${locale}/dashboard/provider`
        const dashUrl = new URL(dashboardPath, request.url)
        const redirectResponse = NextResponse.redirect(dashUrl)
        response.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
    }

    return response
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
