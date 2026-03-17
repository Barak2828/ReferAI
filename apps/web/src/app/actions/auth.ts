'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const locale = formData.get('locale') as string || 'he'

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard/provider`)
}

export async function signup(formData: FormData) {
    const supabase = createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const locale = formData.get('locale') as string || 'he'

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard/provider`)
}

export async function signInWithOAuth(provider: 'google' | 'facebook', locale: string = 'he') {
    const supabase = createClient()
    const origin = headers().get('origin')

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/auth/callback?next=/${locale}/dashboard/provider`,
        },
    })

    if (error) {
        return { error: error.message, url: null }
    }

    if (data.url) {
        return { error: null, url: data.url }
    }

    return { error: 'No redirect URL returned', url: null }
}

export async function signOut(locale: string = 'he') {
    const supabase = createClient()
    await supabase.auth.signOut()
    redirect(`/${locale}/login`)
}
