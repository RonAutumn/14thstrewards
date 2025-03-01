import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// GET /api/rewards
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')

    let query = supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)

    if (tier) {
      query = query.contains('available_for_tiers', [tier])
    }

    const { data: rewards, error } = await query

    if (error) {
      console.error('Supabase error fetching rewards:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      rewards
    })
  } catch (error) {
    console.error('Failed to fetch rewards:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rewards'
    }, { status: 500 })
  }
}

// POST /api/rewards
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const data = await request.json()
    
    const reward = {
      ...data,
      reward_id: data.reward_id || `reward${Date.now()}`,
      available_for_tiers: data.available_for_tiers || ['Bronze', 'Silver', 'Gold', 'Platinum'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_reward_codes: data.has_reward_codes || false
    }

    const { data: insertedReward, error } = await supabase
      .from('rewards')
      .insert(reward)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating reward:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reward: insertedReward
    })
  } catch (error) {
    console.error('Failed to create reward:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create reward'
    }, { status: 500 })
  }
} 