import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { COLLECTIONS, DB_NAME } from '@/lib/db/schema/rewards';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// GET /api/rewards/tiers/analytics
export async function GET() {
    try {
        // Get current user session from cookie
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Session error:', sessionError);
            return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
        }

        if (!session?.user) {
            console.error('No session found');
            return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Get all users with their points and tiers
        const users = await db.collection(COLLECTIONS.USERS).find().toArray();

        // Calculate user distribution per tier
        const userDistribution = users.reduce((acc: Record<string, number>, user) => {
            const tier = user.membershipLevel || 'Bronze';
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
        }, {});

        // Calculate average points per tier
        const pointsSum: Record<string, { total: number; count: number }> = {};
        users.forEach(user => {
            const tier = user.membershipLevel || 'Bronze';
            if (!pointsSum[tier]) {
                pointsSum[tier] = { total: 0, count: 0 };
            }
            pointsSum[tier].total += user.points || 0;
            pointsSum[tier].count += 1;
        });

        const averagePoints = Object.entries(pointsSum).reduce((acc: Record<string, number>, [tier, data]) => {
            acc[tier] = data.count > 0 ? data.total / data.count : 0;
            return acc;
        }, {});

        // Calculate progression rates (users who moved up a tier in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const tierProgressions = await db.collection(COLLECTIONS.TIER_HISTORY)
            .find({
                timestamp: { $gte: thirtyDaysAgo }
            })
            .toArray();

        const progressionCounts: Record<string, number> = {};
        const tierLevels = ['Bronze', 'Silver', 'Gold', 'Platinum'];

        tierProgressions.forEach(progression => {
            const fromTierIndex = tierLevels.indexOf(progression.fromTier);
            const toTierIndex = tierLevels.indexOf(progression.toTier);
            if (toTierIndex > fromTierIndex) {
                progressionCounts[progression.toTier] = (progressionCounts[progression.toTier] || 0) + 1;
            }
        });

        // Calculate progression rates as a percentage of users in the previous tier
        const progressionRates = Object.entries(progressionCounts).reduce((acc: Record<string, number>, [tier, count]) => {
            const tierIndex = tierLevels.indexOf(tier);
            if (tierIndex > 0) {
                const previousTier = tierLevels[tierIndex - 1];
                const previousTierUsers = userDistribution[previousTier] || 1; // Avoid division by zero
                acc[tier] = count / previousTierUsers;
            }
            return acc;
        }, {});

        return NextResponse.json({
            userDistribution,
            averagePoints,
            progressionRates,
        });
    } catch (error) {
        console.error('Failed to fetch tier analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tier analytics' },
            { status: 500 }
        );
    }
} 