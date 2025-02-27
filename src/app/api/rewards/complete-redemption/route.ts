import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schema/rewards';

const dbName = 'rewardsProgram';

export async function POST(request: Request) {
    try {
        const client = await clientPromise;
        const db = client.db(dbName);
        const { userId, rewards } = await request.json();

        if (!userId || !rewards || !Array.isArray(rewards)) {
            return NextResponse.json({
                error: 'Invalid request body',
                details: 'userId and rewards array are required'
            }, { status: 400 });
        }

        // Get user
        const user = await db.collection(COLLECTIONS.USERS).findOne({
            $or: [
                { userId: userId },
                { supabaseId: userId }
            ]
        });

        if (!user) {
            return NextResponse.json({
                error: 'User not found',
                userId
            }, { status: 404 });
        }

        // Get all rewards being redeemed
        const rewardIds = rewards.map(r => r.reward_id);
        const rewardsData = await db.collection(COLLECTIONS.REWARDS)
            .find({ reward_id: { $in: rewardIds } })
            .toArray();

        // Validate all rewards exist
        if (rewardsData.length !== rewardIds.length) {
            return NextResponse.json({
                error: 'One or more rewards not found',
                rewardIds
            }, { status: 404 });
        }

        // Calculate total points cost
        const totalPointsCost = rewardsData.reduce((total, reward) => total + reward.pointsCost, 0);

        // Check if user has enough points
        if ((user.points || 0) < totalPointsCost) {
            return NextResponse.json({
                error: 'Insufficient points',
                required: totalPointsCost,
                current: user.points || 0
            }, { status: 400 });
        }

        // For welcome reward, check if it's already been redeemed
        const welcomeReward = rewards.find(r => r.reward_id === 'welcome_reward');
        if (welcomeReward) {
            const existingRedemption = await db.collection(COLLECTIONS.TRANSACTIONS).findOne({
                user_id: userId,
                reward_id: 'welcome_reward',
                type: 'REDEEM',
                status: 'completed'
            });

            if (existingRedemption) {
                return NextResponse.json({
                    error: 'Welcome reward already redeemed',
                    userId
                }, { status: 400 });
            }
        }

        // Create transactions and update points in a transaction
        const session = await client.startSession();
        try {
            await session.withTransaction(async () => {
                // Create redemption transactions
                const transactions = rewardsData.map(reward => ({
                    user_id: userId,
                    reward_id: reward.reward_id,
                    points: -reward.pointsCost,
                    type: 'REDEEM',
                    description: `Redeemed ${reward.name}`,
                    status: 'completed',
                    created_at: new Date()
                }));

                await db.collection(COLLECTIONS.TRANSACTIONS)
                    .insertMany(transactions, { session });

                // Update user points
                const result = await db.collection(COLLECTIONS.USERS).updateOne(
                    { $or: [{ userId: userId }, { supabaseId: userId }] },
                    { $inc: { points: -totalPointsCost } },
                    { session }
                );

                if (result.modifiedCount === 0) {
                    throw new Error('Failed to update user points');
                }
            });

            // Get updated user data
            const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({
                $or: [{ userId: userId }, { supabaseId: userId }]
            });

            return NextResponse.json({
                success: true,
                points: updatedUser?.points || 0,
                pointsDeducted: totalPointsCost
            });
        } finally {
            await session.endSession();
        }
    } catch (error) {
        console.error('Failed to complete reward redemptions:', error);
        return NextResponse.json({
            error: 'Failed to complete reward redemptions',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 