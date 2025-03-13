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
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

  try {
    // Validate request body
    const body = await request.json()
    const { type, points, description } = body

    // Input validation
    if (!type || !['EARN', 'REDEEM'].includes(type)) {
      return NextResponse.json({
        error: 'Invalid transaction type. Must be EARN or REDEEM.',
        details: 'type must be EARN or REDEEM'
      }, { status: 400 })
    }

    if (typeof points !== 'number' || points <= 0) {
      return NextResponse.json({
        error: 'Invalid points value',
        details: 'points must be a positive number'
      }, { status: 400 })
    }

    if (!description) {
      return NextResponse.json({
        error: 'Description is required',
        details: 'description must be provided'
      }, { status: 400 })
    }

    // Start by getting current user points
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', params.userId)
      .single()

    if (userError) {
      console.error('Failed to fetch user data:', userError)
      return NextResponse.json({
        error: 'User not found',
        details: userError.message
      }, { status: 404 })
    }

    const currentPoints = userData?.points || 0
    const pointsUpdate = type === 'EARN' ? points : -points
    const newPoints = currentPoints + pointsUpdate
    const timestamp = new Date().toISOString()

    // For REDEEM transactions, check if user has enough points
    if (type === 'REDEEM' && currentPoints < points) {
      return NextResponse.json({
        error: 'Insufficient points',
        details: `User has ${currentPoints} points but attempted to redeem ${points} points`
      }, { status: 400 })
    }

    // Update user's points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        points: newPoints,
        updated_at: timestamp
      })
      .eq('id', params.userId)

    if (updateError) {
      console.error('Failed to update points:', updateError)
      return NextResponse.json({
        error: 'Failed to update points',
        details: updateError.message
      }, { status: 500 })
    }

    // Create points history entry
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        user_id: params.userId,
        points_before: currentPoints,
        points_after: newPoints,
        change_amount: Math.abs(points),
        transaction_type: type,
        source: 'manual',
        created_at: timestamp
      })

    if (historyError) {
      // Attempt to rollback points update
      await supabase
        .from('profiles')
        .update({ 
          points: currentPoints,
          updated_at: timestamp
        })
        .eq('id', params.userId)

      console.error('Failed to create points history:', historyError)
      return NextResponse.json({
        error: 'Failed to create points history',
        details: historyError.message
      }, { status: 500 })
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: params.userId,
        points: Math.abs(points),
        type,
        description,
        created_at: timestamp
      })
      .select()
      .single()

    if (transactionError) {
      // Attempt to rollback previous operations
      await Promise.all([
        supabase
          .from('profiles')
          .update({ 
            points: currentPoints,
            updated_at: timestamp
          })
          .eq('id', params.userId),
        supabase
          .from('points_history')
          .delete()
          .eq('user_id', params.userId)
          .eq('created_at', timestamp)
      ])

      console.error('Failed to create transaction:', transactionError)
      return NextResponse.json({
        error: 'Failed to create transaction',
        details: transactionError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      points: newPoints,
      transaction
    })
  } catch (error) {
    console.error('Failed to process transaction:', error)
    return NextResponse.json({
      error: 'Failed to process transaction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}