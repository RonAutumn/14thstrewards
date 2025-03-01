import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { ShippingOrder } from '@/types/orders'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify admin authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch shipping orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'shipping')
      .order('created_at', { ascending: false })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Format orders to match ShippingOrder type
    const formattedOrders: ShippingOrder[] = orders.map(order => {
      const items = typeof order.items === 'string' 
        ? JSON.parse(order.items) 
        : order.items || []

      const shippingAddress = order.shipping_address || {}

      return {
        id: order.id,
        orderId: order.order_id,
        customerName: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        deliveryAddress: `${shippingAddress.street || ''}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zip_code || ''}`,
        items,
        status: order.status,
        total: parseFloat(order.total_amount) || 0,
        timestamp: order.created_at,
        shipmentId: order.shipment_id,
        trackingNumber: order.tracking_number,
        labelUrl: order.shipping_label_url,
        method: order.shipping_method || '',
        shippingFee: parseFloat(order.shipping_cost) || 0
      }
    })

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Error in shipping orders route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 