import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

// GET /api/rewards/multipliers
export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

    // Fetch active points multipliers
    const { data: multipliers, error: multipliersError } = await supabase
      .from('points_multipliers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (multipliersError) throw multipliersError

    // Fetch active multiplier rules
    const { data: rules, error: rulesError } = await supabase
      .from('points_multiplier_rules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (rulesError) throw rulesError

    return NextResponse.json({
      success: true,
      data: {
        multipliers,
        rules
      }
    })
  } catch (error) {
    console.error('Failed to fetch multipliers:', error)
    return NextResponse.json({
      error: 'Failed to fetch multipliers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/rewards/multipliers
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
    const data = await request.json()

    // Determine if we're creating a multiplier or a rule
    if (data.type === 'multiplier') {
      const { data: multiplier, error } = await supabase
        .from('points_multipliers')
        .insert({
          multiplier: data.multiplier,
          start_date: data.startDate,
          end_date: data.endDate,
          description: data.description,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: multiplier
      })
    } else {
      const { data: rule, error } = await supabase
        .from('points_multiplier_rules')
        .insert({
          multiplier: data.multiplier,
          rule_name: data.ruleName,
          product_category: data.productCategory,
          minimum_purchase: data.minimumPurchase,
          start_date: data.startDate,
          end_date: data.endDate,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        data: rule
      })
    }
  } catch (error) {
    console.error('Failed to create multiplier:', error)
    return NextResponse.json({
      error: 'Failed to create multiplier',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 