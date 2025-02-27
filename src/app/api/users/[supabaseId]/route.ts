import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { supabaseId: string } }
) {
  try {
    const supabase = createClient();
    const { supabaseId } = params;

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseId)
      .single();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { supabaseId: string } }
) {
  try {
    const supabase = createClient();
    const { supabaseId } = params;
    const updates = await request.json();

    const { data: user, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', supabaseId)
      .select()
      .single();

    if (error) throw error;
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update user'
    }, { status: 500 });
  }
} 