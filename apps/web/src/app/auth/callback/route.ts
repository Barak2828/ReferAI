import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // Read locale from cookie, default to 'he'
    const cookieStore = cookies()
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he'

    const next = searchParams.get('next') ?? `/${locale}/dashboard/provider`

    if (code) {
        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to the login page with an error
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth-code-error`)
}
