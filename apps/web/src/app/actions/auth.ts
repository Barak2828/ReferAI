'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers, cookies } from 'next/headers'

function getLocale(): string {
    const cookieStore = cookies()
    return cookieStore.get('NEXT_LOCALE')?.value || 'he'
}

export async function login(formData: FormData) {
    const supabase = createClient()
    const locale = getLocale()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: 'Invalid email or password' }
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard/provider`)
}

export async function signup(formData: FormData) {
    const supabase = createClient()
    const locale = getLocale()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Email and password are required' }
    }

    if (password.length < 8) {
        return { error: 'Password must be at least 8 characters' }
    }

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: 'Could not create account. Please try again.' }
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard/provider`)
}

export async function signInWithOAuth(provider: 'google' | 'facebook') {
    const supabase = createClient()
    const origin = headers().get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    })

    if (error) {
        return { error: 'OAuth sign-in failed. Please try again.' }
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function logout() {
    const supabase = createClient()
    const locale = getLocale()

    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect(`/${locale}/login`)
}
