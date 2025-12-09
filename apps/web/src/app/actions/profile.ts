'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
    const supabase = createClient()

    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const locale = formData.get('locale') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // In a real app, we would update the public.User table via an API or direct DB call if using Prisma.
    // Since we are using Supabase Auth, we can store metadata in user_metadata for now,
    // OR we assume there is a trigger that syncs Auth users to public.User.
    // For this MVP, let's update the user metadata which is easiest for the frontend to access.

    const { error } = await supabase.auth.updateUser({
        data: {
            full_name: name,
            role: role,
            locale: locale
        }
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
