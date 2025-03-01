import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

// GET /api/rewards/tiers/[tierId]
export async function GET(
  request: Request,
  { params }: { params: { tierId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

    const { data: tier, error } = await supabase
      .from('tiers')
      .select('*')
      .eq('tier_id', params.tierId)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      tier
    })
  } catch (error) {
    console.error('Failed to fetch tier:', error)
    return NextResponse.json({
      error: 'Failed to fetch tier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH /api/rewards/tiers/[tierId]
export async function PATCH(
  request: Request,
  { params }: { params: { tierId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
    const data = await request.json()

    const { data: tier, error } = await supabase
      .from('tiers')
      .update({
        name: data.name,
        level: data.level,
        points_threshold: data.pointsThreshold,
        benefits: data.benefits,
        updated_at: new Date().toISOString()
      })
      .eq('tier_id', params.tierId)
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
    console.error('Failed to update tier:', error)
    return NextResponse.json({
      error: 'Failed to update tier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE /api/rewards/tiers/[tierId]
export async function DELETE(
  request: Request,
  { params }: { params: { tierId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

    const { error } = await supabase
      .from('tiers')
      .delete()
      .eq('tier_id', params.tierId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Failed to delete tier:', error)
    return NextResponse.json({
      error: 'Failed to delete tier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 