import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Current user request received');

    const supabase = createClient();

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    console.log('Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      timestamp: new Date().toISOString()
    });

    if (!session?.user) {
      console.log('No session found in cookie');
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      console.log('User profile not found');
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        ...profile,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch current user'
    }, { status: 500 });
  }
} 