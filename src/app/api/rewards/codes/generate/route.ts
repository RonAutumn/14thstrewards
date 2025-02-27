import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/db';
import { COLLECTIONS, DB_NAME } from '@/lib/db/schema/rewards';
import { customAlphabet } from 'nanoid';

const generateRewardCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { rewardType, pointsValue, itemDetails, expiresAt, isUnlimitedUse } = body;

        // Validate request data
        if (!rewardType) {
            return NextResponse.json(
                { error: 'Reward type is required' },
                { status: 400 }
            );
        }

        if (rewardType === 'points' && !pointsValue) {
            return NextResponse.json(
                { error: 'Points value is required for points reward type' },
                { status: 400 }
            );
        }

        if ((rewardType === 'item' || rewardType === 'both') && !itemDetails?.name) {
            return NextResponse.json(
                { error: 'Item name is required for item reward type' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Generate the reward code
        const code = {
            code: generateRewardCode(),
            pointsValue: rewardType === 'points' || rewardType === 'both' ? pointsValue : undefined,
            itemDetails: rewardType === 'item' || rewardType === 'both' ? {
                name: itemDetails.name,
                description: itemDetails.description || '',
                value: itemDetails.value || 0
            } : undefined,
            isRedeemed: false,
            createdAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            isUnlimitedUse: isUnlimitedUse || false,
            userRedemptions: []
        };

        // Insert the code into the rewardscodes collection
        const result = await db.collection(COLLECTIONS.REWARD_CODES).insertOne(code);

        if (!result.acknowledged) {
            throw new Error('Failed to generate reward code');
        }

        return NextResponse.json({
            code: {
                ...code,
                _id: result.insertedId.toString()
            }
        });
    } catch (error) {
        console.error('Error generating reward code:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
} 