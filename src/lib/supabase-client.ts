import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Initialize the Supabase client
export const supabaseClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

declare global {
    var supabaseClient: SupabaseClient | undefined;
}

export async function getSupabaseClient(): Promise<SupabaseClient> {
    if (global.supabaseClient) {
        return global.supabaseClient;
    }

    // Create the client
    const client = createClientComponentClient();
    global.supabaseClient = client;

    try {
        // Try to restore session from storage
        const { data: { session }, error } = await client.auth.getSession();

        if (error) {
            console.error('Error getting session:', error);
            return client;
        }

        if (session) {
            // Check if session is stale (older than 60 seconds)
            const isStale = session.expires_at &&
                new Date(session.expires_at * 1000).getTime() - Date.now() < 60000;

            if (isStale) {
                console.log('Session is stale, attempting refresh...');
                const { data: { session: refreshedSession }, error: refreshError } =
                    await client.auth.refreshSession();

                if (!refreshError && refreshedSession) {
                    await client.auth.setSession(refreshedSession);
                }
            } else {
                await client.auth.setSession(session);
            }
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
    }

    return client;
}

// Helper to check if we have an active session
export async function hasActiveSession(): Promise<boolean> {
    try {
        const client = await getSupabaseClient();
        const { data: { session }, error } = await client.auth.getSession();

        if (error || !session) {
            return false;
        }

        // Check if session is expired or about to expire
        if (session.expires_at) {
            const expiresAt = new Date(session.expires_at * 1000).getTime();
            const now = Date.now();

            // If session expires in less than 5 minutes, try to refresh
            if (expiresAt - now < 300000) {
                const { data: { session: refreshedSession }, error: refreshError } =
                    await client.auth.refreshSession();

                if (refreshError) {
                    console.error('Error refreshing session:', refreshError);
                    return false;
                }

                return !!refreshedSession?.access_token;
            }
        }

        return !!session.access_token;
    } catch (error) {
        console.error('Error in hasActiveSession:', error);
        return false;
    }
} 