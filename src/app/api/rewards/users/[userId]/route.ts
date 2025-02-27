import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/db/schema';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // First, try to get the existing user
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw fetchError;
    }

    // If user doesn't exist, create a new one
    if (!profile) {
      // Get the user's email from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(params.userId);
      
      if (authError) {
        throw authError;
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: params.userId,
          email: authUser?.email || '',
          points: 0,
          membership_level: 'bronze',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return NextResponse.json(newProfile);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in user API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json();
    const supabase = createServerComponentClient<Database>({ cookies });

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}