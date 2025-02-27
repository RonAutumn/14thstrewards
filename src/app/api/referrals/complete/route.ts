import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's referral record
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', session.user.id)
      .eq('status', 'pending')
      .single();

    if (referralError || !referral) {
      return NextResponse.json(
        { error: 'No pending referral found' },
        { status: 404 }
      );
    }

    // Start a transaction to update everything atomically
    const { data: result, error: transactionError } = await supabase.rpc(
      'complete_referral',
      {
        referral_id: referral.id,
        referrer_points: 1000, // Points for referring
        referred_points: 500,  // Points for being referred
      }
    );

    if (transactionError) {
      console.error('Transaction error:', transactionError);
      return NextResponse.json(
        { error: 'Failed to process referral' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Referral completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 