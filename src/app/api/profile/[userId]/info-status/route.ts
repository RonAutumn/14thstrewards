import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { userId } = params;

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found'
      }, { status: 404 });
    }

    // Get user addresses
    const { data: addresses, error: addressError } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId);

    if (addressError) throw addressError;

    // Check newsletter subscription from notifications preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefError && prefError.code !== 'PGRST116') throw prefError; // Ignore not found error

    const response = {
      phone_verified: Boolean(profile.phone_verified),
      birth_date: profile.birth_date,
      has_address: addresses && addresses.length > 0,
      address_verified: addresses?.some(addr => addr.is_verified) || false,
      has_preferences: Boolean(preferences?.preferences?.shopping_preferences),
      newsletter_subscribed: Boolean(preferences?.preferences?.newsletter_subscribed),
      has_profile_picture: Boolean(profile.avatar_url),
      info_points_claimed: profile.info_points_claimed || {}
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching profile status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch profile status'
    }, { status: 500 });
  }
} 