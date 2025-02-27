import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { COLLECTIONS, DB_NAME } from '@/lib/db/schema/rewards';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET /api/rewards/tiers/eligibility
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const targetTier = searchParams.get('targetTier');

        if (!userId || !targetTier) {
            return NextResponse.json(
                { error: 'userId and targetTier are required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Get user data
        const user = await db.collection(COLLECTIONS.USERS).findOne({ userId });
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Get target tier requirements
        const tier = await db.collection(COLLECTIONS.TIERS).findOne({ name: targetTier });
        if (!tier) {
            return NextResponse.json(
                { error: 'Tier not found' },
                { status: 404 }
            );
        }

        const missingRequirements: string[] = [];

        // Check points threshold
        if (user.points < tier.pointsThreshold) {
            missingRequirements.push(`Need ${tier.pointsThreshold - user.points} more points`);
        }

        // Check purchase count
        if (tier.progressionRequirements?.minPurchaseCount > 0) {
            const purchaseCount = await db.collection(COLLECTIONS.ORDERS)
                .countDocuments({ userId });
            
            if (purchaseCount < tier.progressionRequirements.minPurchaseCount) {
                missingRequirements.push(
                    `Need ${tier.progressionRequirements.minPurchaseCount - purchaseCount} more purchases`
                );
            }
        }

        // Check total spent
        if (tier.progressionRequirements?.minTotalSpent > 0) {
            const orders = await db.collection(COLLECTIONS.ORDERS)
                .find({ userId })
                .toArray();
            
            const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            
            if (totalSpent < tier.progressionRequirements.minTotalSpent) {
                missingRequirements.push(
                    `Need to spend $${(tier.progressionRequirements.minTotalSpent - totalSpent).toFixed(2)} more`
                );
            }
        }

        // Check days active
        if (tier.progressionRequirements?.minDaysActive > 0) {
            const userCreatedAt = new Date(user.created_at);
            const daysActive = Math.floor((Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysActive < tier.progressionRequirements.minDaysActive) {
                missingRequirements.push(
                    `Need to be active for ${tier.progressionRequirements.minDaysActive - daysActive} more days`
                );
            }
        }

        return NextResponse.json({
            eligible: missingRequirements.length === 0,
            missingRequirements,
        });
    } catch (error) {
        console.error('Failed to check tier eligibility:', error);
        return NextResponse.json(
            { error: 'Failed to check tier eligibility' },
            { status: 500 }
        );
    }
} 