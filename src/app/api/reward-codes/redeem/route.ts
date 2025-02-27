import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    console.log('Reward code redemption request received');

    try {
        // Parse request body
        const body = await request.json();
        const { code, userId } = body;

        if (!code) {
            console.log('No code provided in request');
            return NextResponse.json(
                { error: 'Reward code is required' },
                { status: 400 }
            );
        }

        if (!userId) {
            console.log('No user ID provided in request');
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // Check if code exists and is valid
        const { data: rewardCode, error: codeError } = await supabase
            .from('reward_codes')
            .select('*')
            .eq('code', code.trim())
            .eq('is_redeemed', false)
            .single();

        if (codeError || !rewardCode) {
            return NextResponse.json(
                { error: 'Invalid or already redeemed code' },
                { status: 400 }
            );
        }

        // Get user's current points
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Update code as redeemed and update user points in a transaction
        const newPoints = user.points + rewardCode.points_value;
        const { error: updateError } = await supabase.rpc('redeem_reward_code', {
            p_code: code.trim(),
            p_user_id: userId,
            p_points: rewardCode.points_value
        });

        if (updateError) {
            console.error('Error redeeming code:', updateError);
            return NextResponse.json(
                { error: 'Failed to redeem code' },
                { status: 500 }
            );
        }

        // Return success response with points info
        return NextResponse.json({
            success: true,
            message: 'Code redeemed successfully',
            pointsEarned: rewardCode.points_value,
            currentPoints: newPoints
        });
    } catch (error) {
        console.error('Error in reward code redemption:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to redeem code' },
            { status: 500 }
        );
    }
} 