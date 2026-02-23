'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'

export async function updateProfile(formData: FormData) {
    // Require authentication
    const auth = await requireAuth()
    if (auth.error) {
        return { success: false, error: auth.error }
    }

    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const locale = formData.get('locale') as string

    // Validate inputs
    if (!name || name.trim().length < 2) {
        return { success: false, error: 'Name must be at least 2 characters' }
    }
    if (!['PROVIDER', 'PROMOTER'].includes(role?.toUpperCase())) {
        return { success: false, error: 'Invalid role selected' }
    }
    if (!['he', 'en'].includes(locale)) {
        return { success: false, error: 'Invalid language selected' }
    }

    const supabase = createClient()

    try {
        const { error } = await supabase.auth.updateUser({
            data: {
                full_name: name.trim(),
                role: role.toUpperCase(),
                locale: locale
            }
        })

        if (error) {
            console.error('Profile update error:', error)
            return { success: false, error: 'Failed to update profile. Please try again.' }
        }

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (err) {
        console.error('Profile update exception:', err)
        return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
}
