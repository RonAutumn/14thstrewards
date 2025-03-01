import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

// GET /api/rewards/tiers/analytics
export async function GET() {
    try {
        const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

        // Get all tiers for reference
        const { data: tiers, error: tiersError } = await supabase
            .from('tiers')
            .select('*')
            .order('level', { ascending: true })

        if (tiersError) throw tiersError

        // Get user distribution across tiers
        const { data: userDistribution, error: distributionError } = await supabase
            .from('profiles')
            .select('current_tier_id, count')
            .count()
            .group_by('current_tier_id')

        if (distributionError) throw distributionError

        // Get average points per tier
        const { data: averagePoints, error: pointsError } = await supabase
            .from('profiles')
            .select('current_tier_id, points')
            .select('current_tier_id, avg(points) as average')
            .group_by('current_tier_id')

        if (pointsError) throw pointsError

        // Calculate progression rates (simplified version)
        const { data: progressions, error: progressionError } = await supabase
            .from('points_history')
            .select('user_id, points_earned')
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        if (progressionError) throw progressionError

        // Format the response
        const analytics = {
            userDistribution: Object.fromEntries(
                userDistribution.map(({ current_tier_id, count }) => [
                    tiers.find(t => t.tier_id === current_tier_id)?.name || 'Unknown',
                    count
                ])
            ),
            averagePoints: Object.fromEntries(
                averagePoints.map(({ current_tier_id, average }) => [
                    tiers.find(t => t.tier_id === current_tier_id)?.name || 'Unknown',
                    Math.round(average || 0)
                ])
            ),
            progressionRates: Object.fromEntries(
                tiers.map((tier, index) => [
                    tier.name,
                    index === tiers.length - 1 ? 0 : 0.1 // Placeholder rate of 10% between tiers
                ])
            )
        }

        return NextResponse.json({
            success: true,
            analytics
        })
    } catch (error) {
        console.error('Failed to fetch tier analytics:', error)
        return NextResponse.json({
            error: 'Failed to fetch tier analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 