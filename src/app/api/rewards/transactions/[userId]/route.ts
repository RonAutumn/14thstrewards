import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

    // Get points history
    const { data: pointsHistory, error: pointsError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })

    if (pointsError) {
      console.error('Failed to fetch points history:', pointsError)
      throw pointsError
    }

    // Get transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Failed to fetch transactions:', transactionsError)
      throw transactionsError
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points, membership_level')
      .eq('id', params.userId)
      .single()

    if (profileError) {
      console.error('Failed to fetch profile:', profileError)
      throw profileError
    }

    return NextResponse.json({
      success: true,
      pointsHistory: pointsHistory || [],
      transactions: transactions || [],
      profile
    })
  } catch (error) {
    console.error('Failed to fetch rewards data:', error)
    return NextResponse.json({
      error: 'Failed to fetch rewards data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })
    const { type, points, description, orderDetails } = await request.json()

    // Start by getting current user points
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', params.userId)
      .single()

    if (userError) throw userError

    const currentPoints = userData?.points || 0
    const pointsUpdate = type === 'EARN' ? points : -points
    const newPoints = currentPoints + pointsUpdate

    // Update user's points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.userId)

    if (updateError) throw updateError

    // Create points history entry
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: params.userId,
        points_before: currentPoints,
        points_after: newPoints,
        change_amount: points,
        transaction_type: type,
        source: 'manual',
        created_at: new Date().toISOString()
      })

    if (historyError) throw historyError

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: params.userId,
        points,
        type,
        description,
        created_at: new Date().toISOString()
      })

    if (transactionError) throw transactionError

    return NextResponse.json({ 
      success: true,
      points: newPoints
    })
  } catch (error) {
    console.error('Failed to create transaction:', error)
    return NextResponse.json({
      error: 'Failed to create transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}