import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: { rewardId: string } }
) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            return NextResponse.json({
                error: 'Unauthorized. Please ensure you are logged in.',
            }, { status: 401 });
        }

        const userId = session.user.id;
        const { rewardId } = params;

        // Parse request body for checkout flag
        let isCheckout = false;
        try {
            const body = await request.json();
            isCheckout = body.isCheckout || false;
        } catch (e) {
            console.error('Failed to parse request body:', e);
            return NextResponse.json({
                error: 'Invalid request body'
            }, { status: 400 });
        }

        console.log('Attempting to redeem reward:', { userId, rewardId, isCheckout });

        // Get reward details
        const { data: reward, error: rewardError } = await supabase
            .from('rewards')
            .select('*')
            .eq('reward_id', rewardId)
            .single();

        if (rewardError || !reward) {
            console.log('Reward not found:', rewardId);
            return NextResponse.json({
                error: 'Reward not found',
                rewardId
            }, { status: 404 });
        }

        if (!reward.is_active) {
            console.log('Reward is not active:', rewardId);
            return NextResponse.json({
                error: 'Reward is not active',
                rewardId
            }, { status: 400 });
        }

        // Check redemption limit for welcome reward
        if (rewardId === 'welcome_reward') {
            const { count, error: countError } = await supabase
                .from('points_history')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('reward_id', rewardId)
                .eq('type', 'REDEEM');

            if (countError) {
                console.error('Error checking redemption count:', countError);
                return NextResponse.json({
                    error: 'Failed to check redemption status'
                }, { status: 500 });
            }

            if (count && count > 0) {
                console.log('Welcome reward already redeemed:', { userId, rewardId });
                return NextResponse.json({
                    error: 'Welcome reward can only be redeemed once',
                    details: { userId, rewardId }
                }, { status: 400 });
            }
        }

        // Get current points from profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            console.error('Error fetching user profile:', profileError);
            return NextResponse.json({
                error: 'Failed to fetch user points'
            }, { status: 500 });
        }

        const currentPoints = profile.points || 0;

        if (currentPoints < reward.points_cost) {
            console.log('Insufficient points:', {
                required: reward.points_cost,
                available: currentPoints
            });
            return NextResponse.json({
                error: 'Insufficient points',
                required: reward.points_cost,
                available: currentPoints
            }, { status: 400 });
        }

        // Start a Supabase transaction using RPC
        const { data: transaction, error: transactionError } = await supabase.rpc(
            'redeem_reward',
            {
                p_user_id: userId,
                p_reward_id: rewardId,
                p_points_cost: reward.points_cost,
                p_reward_name: reward.name,
                p_is_checkout: isCheckout
            }
        );

        if (transactionError) {
            console.error('Failed to process reward redemption:', transactionError);
            return NextResponse.json({
                error: 'Failed to redeem reward',
                details: transactionError.message
            }, { status: 500 });
        }

        // Get updated points
        const { data: updatedProfile } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();

        return NextResponse.json({
            success: true,
            points: updatedProfile?.points || 0,
            transaction
        });

    } catch (error) {
        console.error('Failed to redeem reward:', error);
        return NextResponse.json({
            error: 'Failed to redeem reward',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 