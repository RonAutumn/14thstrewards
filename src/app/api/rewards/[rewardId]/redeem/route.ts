import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schema/rewards';
import { getUserPoints } from '@/lib/db/rewards';

const dbName = 'rewardsProgram';

// This is the handler for /api/rewards/[rewardId]/redeem
export async function POST(
    request: Request,
    { params }: { params: { rewardId: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db(dbName);

        // Parse request body
        let userId;
        let isCheckout = false;
        try {
            const body = await request.json();
            userId = body.userId;
            isCheckout = body.isCheckout || false;
        } catch (e) {
            console.error('Failed to parse request body:', e);
            return NextResponse.json({
                error: 'Invalid request body'
            }, { status: 400 });
        }

        const { rewardId } = params;

        console.log('Attempting to redeem reward:', { userId, rewardId, isCheckout });

        // Validate input
        if (!userId || !rewardId) {
            console.log('Missing required fields:', { userId, rewardId });
            return NextResponse.json({
                error: 'Missing required fields',
                details: { userId, rewardId }
            }, { status: 400 });
        }

        // Get user and reward
        const [user, reward] = await Promise.all([
            db.collection(COLLECTIONS.USERS).findOne({
                $or: [
                    { userId: userId },
                    { supabaseId: userId }
                ]
            }),
            db.collection(COLLECTIONS.REWARDS).findOne({
                reward_id: rewardId
            })
        ]);

        console.log('Found user and reward:', {
            userExists: !!user,
            rewardExists: !!reward,
            userId,
            userPoints: user?.points,
            rewardCost: reward?.pointsCost
        });

        // Check if user exists
        if (!user) {
            console.log('User not found:', userId);
            return NextResponse.json({
                error: 'User not found. Please ensure you are logged in.',
                userId
            }, { status: 404 });
        }

        // Check if reward exists and is available
        if (!reward) {
            console.log('Reward not found:', rewardId);
            return NextResponse.json({
                error: 'Reward not found',
                rewardId
            }, { status: 404 });
        }

        if (!reward.isActive) {
            console.log('Reward is not active:', rewardId);
            return NextResponse.json({
                error: 'Reward is not active',
                rewardId
            }, { status: 400 });
        }

        // Check redemption limit for welcome reward
        if (reward.reward_id === 'welcome_reward') {
            const existingRedemptions = await db.collection(COLLECTIONS.TRANSACTIONS).countDocuments({
                user_id: userId,
                reward_id: rewardId,
                type: 'REDEEM'
            });

            if (existingRedemptions > 0) {
                console.log('Welcome reward already redeemed:', { userId, rewardId });
                return NextResponse.json({
                    error: 'Welcome reward can only be redeemed once',
                    details: { userId, rewardId }
                }, { status: 400 });
            }
        }

        // Check if user has enough points
        const currentPoints = await getUserPoints(userId);

        if (currentPoints < reward.pointsCost) {
            console.log('Insufficient points:', {
                required: reward.pointsCost,
                available: currentPoints
            });
            return NextResponse.json({
                error: 'Insufficient points',
                required: reward.pointsCost,
                available: currentPoints
            }, { status: 400 });
        }

        // Create redemption transaction with checkout flag
        const transaction = {
            user_id: userId,
            reward_id: rewardId,
            points: -Math.abs(reward.pointsCost),
            type: 'REDEEM',
            description: `Redeemed ${reward.name}${isCheckout ? ' at checkout' : ''}`,
            created_at: new Date(),
            status: isCheckout ? 'completed' : 'pending',
            pointsCost: reward.pointsCost,
            isCheckoutRedemption: isCheckout
        };

        try {
            // In development, perform operations without a transaction
            if (process.env.NODE_ENV === 'development') {
                // Only deduct points immediately if this is a checkout redemption
                if (isCheckout) {
                    // Insert the transaction first
                    const insertResult = await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transaction);
                    if (!insertResult.acknowledged) {
                        throw new Error('Failed to create transaction record');
                    }

                    // Update user points
                    const updateResult = await db.collection(COLLECTIONS.USERS).updateOne(
                        { $or: [{ userId: userId }, { supabaseId: userId }] },
                        {
                            $inc: { points: -reward.pointsCost },
                            $set: {
                                lastPointsUpdate: new Date(),
                                updatedAt: new Date()
                            }
                        }
                    );

                    if (updateResult.modifiedCount === 0) {
                        // Rollback the transaction insert if user update fails
                        await db.collection(COLLECTIONS.TRANSACTIONS).deleteOne({ _id: insertResult.insertedId });
                        throw new Error('Failed to update user points');
                    }
                } else {
                    // For non-checkout redemptions, just create a pending transaction
                    const insertResult = await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transaction);
                    if (!insertResult.acknowledged) {
                        throw new Error('Failed to create transaction record');
                    }
                }
            } else {
                // In production, use transactions
                const session = await client.startSession();
                try {
                    await session.withTransaction(async () => {
                        // Insert transaction
                        await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transaction, { session });

                        // Only update points if this is a checkout redemption
                        if (isCheckout) {
                            await db.collection(COLLECTIONS.USERS).updateOne(
                                { $or: [{ userId: userId }, { supabaseId: userId }] },
                                {
                                    $inc: { points: -reward.pointsCost },
                                    $set: {
                                        lastPointsUpdate: new Date(),
                                        updatedAt: new Date()
                                    }
                                },
                                { session }
                            );
                        }
                    });
                } finally {
                    await session.endSession();
                }
            }

            // Get updated points
            const updatedPoints = await getUserPoints(userId);

            return NextResponse.json({
                success: true,
                points: updatedPoints,
                transaction
            });
        } catch (error) {
            console.error('Failed to process reward redemption:', error);
            return NextResponse.json({
                error: 'Failed to redeem reward',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Failed to redeem reward:', error);
        return NextResponse.json({
            error: 'Failed to redeem reward',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 