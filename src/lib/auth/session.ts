import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rewardsService } from '@/features/rewards/rewards.service'

export interface SessionValidationResult {
  isValid: boolean
  error?: string
  user?: {
    id: string
    email?: string
    isAdmin?: boolean
  }
}

export async function validateSession(): Promise<SessionValidationResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Session validation error:', error)
      return {
        isValid: false,
        error: 'Failed to validate session'
      }
    }

    if (!session) {
      return {
        isValid: false,
        error: 'No active session'
      }
    }

    // Check session expiry
    const now = Date.now() / 1000
    if (session.expires_at && session.expires_at < now) {
      return {
        isValid: false,
        error: 'Session expired'
      }
    }

    // Verify user exists in rewards system
    try {
      const userProfile = await rewardsService.getUserProfile(session.user.id)
      if (!userProfile) {
        return {
          isValid: false,
          error: 'User not found in rewards system'
        }
      }

      // Get admin status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      return {
        isValid: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          isAdmin: profile?.is_admin || false
        }
      }
    } catch (error) {
      console.error('Error verifying user profile:', error)
      return {
        isValid: false,
        error: 'Failed to verify user profile'
      }
    }
  } catch (error) {
    console.error('Unexpected error in session validation:', error)
    return {
      isValid: false,
      error: 'Unexpected error during session validation'
    }
  }
}

export async function refreshSession(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return false
    }

    // Attempt to refresh the session
    const { data: refreshedSession, error: refreshError } = 
      await supabase.auth.refreshSession()

    if (refreshError || !refreshedSession) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error refreshing session:', error)
    return false
  }
} 