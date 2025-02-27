import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/db/schema'

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
    
    // Get userId from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Get all active rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)

    if (rewardsError) throw rewardsError

    // If no userId provided, return all active rewards
    if (!userId) {
      return NextResponse.json({ rewards })
    }

    // Get user's completed redemptions
    const { data: userRedemptions, error: redemptionsError } = await supabase
      .from('transactions')
      .select('reward_id')
      .eq('user_id', userId)
      .eq('type', 'REDEEM')

    if (redemptionsError) throw redemptionsError

    // Create a set of redeemed rewards
    const redeemedRewards = new Set(userRedemptions.map(t => t.reward_id))

    // Filter out one-time rewards that have been redeemed
    const availableRewards = rewards.filter(reward => {
      // If it's the welcome reward and it's been redeemed, filter it out
      if (reward.reward_id === 'welcome_reward' && redeemedRewards.has(reward.reward_id)) {
        return false
      }
      // Add other one-time reward checks here if needed
      return true
    })

    return NextResponse.json({
      rewards: availableRewards
    })
  } catch (error) {
    console.error('Failed to fetch available rewards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available rewards' },
      { status: 500 }
    )
  }
} 