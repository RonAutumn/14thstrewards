import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

// POST /api/rewards/transactions
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
    const data = await request.json()

    // Validate required fields
    if (!data.user_id || !data.points || !data.type) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: 'user_id, points, and type are required'
      }, { status: 400 })
    }

    // Ensure type is valid
    if (!['EARN', 'REDEEM'].includes(data.type)) {
      return NextResponse.json({
        error: 'Invalid transaction type',
        details: 'Type must be either EARN or REDEEM'
      }, { status: 400 })
    }

    // Create the transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: data.user_id,
        points: data.points,
        type: data.type,
        description: data.description,
        reward_id: data.reward_id,
        reward_code: data.reward_code,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (transactionError) {
      throw transactionError
    }

    // Update user's points
    const pointsChange = data.type === 'EARN' ? data.points : -data.points
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        points: supabase.rpc('increment_points', { amount: pointsChange }),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user_id)

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({
      success: true,
      transaction
    })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({
      error: 'Failed to create transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/rewards/transactions
export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      transactions
    })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json({
      error: 'Failed to fetch transactions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 