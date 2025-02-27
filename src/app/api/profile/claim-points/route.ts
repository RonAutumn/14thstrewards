import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const POINTS_MAP = {
  phone: 500,
  birthday: 500,
  address: 750,
  preferences: 250,
  newsletter: 250,
  profile_picture: 250
};

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { userId, infoType } = await request.json();

    if (!userId || !infoType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate info type
    if (!POINTS_MAP[infoType as keyof typeof POINTS_MAP]) {
      return NextResponse.json({
        success: false,
        error: 'Invalid information type'
      }, { status: 400 });
    }

    // Get current user profile
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

    // Check if points were already claimed
    const claimedPoints = profile.info_points_claimed || {};
    if (claimedPoints[infoType]) {
      return NextResponse.json({
        success: false,
        error: 'Points already claimed for this information'
      }, { status: 400 });
    }

    // Verify the information is actually completed
    let isCompleted = false;
    switch (infoType) {
      case 'phone':
        isCompleted = Boolean(profile.phone_verified);
        break;
      case 'birthday':
        isCompleted = Boolean(profile.birth_date);
        break;
      case 'address':
        const { data: addresses } = await supabase
          .from('user_addresses')
          .select('is_verified')
          .eq('user_id', userId);
        isCompleted = addresses?.some(addr => addr.is_verified) || false;
        break;
      case 'preferences':
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', userId)
          .single();
        isCompleted = Boolean(prefs?.preferences?.shopping_preferences);
        break;
      case 'newsletter':
        const { data: newsletter } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', userId)
          .single();
        isCompleted = Boolean(newsletter?.preferences?.newsletter_subscribed);
        break;
      case 'profile_picture':
        isCompleted = Boolean(profile.avatar_url);
        break;
    }

    if (!isCompleted) {
      return NextResponse.json({
        success: false,
        error: 'Information not completed or verified'
      }, { status: 400 });
    }

    const pointsToAward = POINTS_MAP[infoType as keyof typeof POINTS_MAP];

    // Start a transaction to update points and mark as claimed
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        points: profile.points + pointsToAward,
        info_points_claimed: {
          ...claimedPoints,
          [infoType]: {
            claimed_at: new Date().toISOString(),
            points: pointsToAward
          }
        }
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Record the points transaction
    const { error: transactionError } = await supabase
      .from('points_history')
      .insert({
        user_id: userId,
        points_before: profile.points,
        points_after: profile.points + pointsToAward,
        change_amount: pointsToAward,
        transaction_type: 'EARN',
        source: 'PROFILE_COMPLETION',
        metadata: {
          info_type: infoType,
          completion_type: 'profile_info'
        }
      });

    if (transactionError) throw transactionError;

    return NextResponse.json({
      success: true,
      pointsAwarded: pointsToAward,
      newTotal: updatedProfile.points
    });
  } catch (error) {
    console.error('Error claiming points:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to claim points'
    }, { status: 500 });
  }
} 