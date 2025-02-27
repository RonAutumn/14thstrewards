import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/rewards
export async function GET(request: Request) {
  try {
    const supabase = createClient()
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

    if (error) throw error

    return NextResponse.json({
      success: true,
      rewards
    })
  } catch (error) {
    console.error('Failed to fetch rewards:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch rewards'
    }, { status: 500 })
  }
}

// POST /api/rewards
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const data = await request.json()
    
    const reward = {
      ...data,
      reward_id: `reward${Date.now()}`,
      available_for_tiers: data.available_for_tiers || ['Bronze', 'Silver', 'Gold', 'Platinum'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: insertedReward, error } = await supabase
      .from('rewards')
      .insert(reward)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      reward: insertedReward
    })
  } catch (error) {
    console.error('Failed to create reward:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create reward'
    }, { status: 500 })
  }
} 