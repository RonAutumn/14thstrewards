import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

// GET /api/rewards/tiers
export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

    const { data: tiers, error } = await supabase
      .from('tiers')
      .select('*')
      .order('level', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      tiers
    })
  } catch (error) {
    console.error('Failed to fetch tiers:', error)
    return NextResponse.json({
      error: 'Failed to fetch tiers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/rewards/tiers
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
    const data = await request.json()

    const { data: tier, error } = await supabase
      .from('tiers')
      .insert({
        name: data.name,
        level: data.level,
        points_threshold: data.pointsThreshold,
        benefits: data.benefits,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      tier
    })
  } catch (error) {
    console.error('Failed to create tier:', error)
    return NextResponse.json({
      error: 'Failed to create tier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 