import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getTrackingInfo } from '@/lib/shipstation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      console.error('Error fetching order:', orderError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify user has access to this order
    const isAdmin = await checkIsAdmin(supabase, session.user.id)
    const isOrderOwner = order.user_id === session.user.id

    if (!isAdmin && !isOrderOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!order.tracking_number) {
      return NextResponse.json(
        { error: 'No tracking number available' },
        { status: 400 }
      )
    }

    // Get tracking information from ShipStation
    const trackingInfo = await getTrackingInfo(order.tracking_number)

    // Update order status if needed
    if (trackingInfo.status !== order.status) {
      await supabase
        .from('orders')
        .update({
          status: trackingInfo.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
    }

    return NextResponse.json(trackingInfo)
  } catch (error) {
    console.error('Error getting tracking info:', error)
    return NextResponse.json(
      { error: 'Failed to get tracking information' },
      { status: 500 }
    )
  }
}

async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error || !profile) return false
  return profile.is_admin === true
} 