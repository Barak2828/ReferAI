'use server'

import { createClient } from '@/lib/supabase/server'

export interface AuthUser {
    id: string
    email: string
    user_metadata: Record<string, unknown>
}

export type AuthResult =
    | { user: AuthUser; error?: never }
    | { error: string; user?: never }

/**
 * Require the current user to be authenticated.
 * Returns the user object or an error string.
 */
export async function requireAuth(): Promise<AuthResult> {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return { error: 'Authentication required' }
    }

    return {
        user: {
            id: user.id,
            email: user.email!,
            user_metadata: user.user_metadata,
        }
    }
}

/**
 * Require the current user to have one of the allowed roles.
 * Role is read from user_metadata.role.
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthResult> {
    const result = await requireAuth()
    if (result.error) return result

    const userRole = (result.user.user_metadata?.role as string)?.toUpperCase()
    if (!userRole || !allowedRoles.includes(userRole)) {
        return { error: 'Insufficient permissions' }
    }

    return result
}
