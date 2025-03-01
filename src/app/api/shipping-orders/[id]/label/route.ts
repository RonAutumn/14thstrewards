import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createShipment, createShippingLabel } from '@/lib/shipstation'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Create shipment in ShipStation
    const shipmentDetails = {
      orderId: order.order_id,
      orderNumber: order.order_id,
      orderDate: order.created_at,
      orderStatus: 'awaiting_shipment',
      customerUsername: order.customer_name,
      customerEmail: order.customer_email,
      billTo: {
        name: order.customer_name,
        street1: order.shipping_address.street,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        postalCode: order.shipping_address.zip_code,
        country: order.shipping_address.country || 'US',
        phone: order.customer_phone
      },
      shipTo: {
        name: order.customer_name,
        street1: order.shipping_address.street,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        postalCode: order.shipping_address.zip_code,
        country: order.shipping_address.country || 'US',
        phone: order.customer_phone
      },
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        sku: item.id
      }))
    }

    const shipment = await createShipment(shipmentDetails)

    // Create shipping label
    const label = await createShippingLabel(shipment.shipmentId, order.shipping_method)

    // Update order with shipping information
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        shipment_id: shipment.shipmentId,
        tracking_number: label.trackingNumber,
        shipping_label_url: label.labelUrl,
        label_id: label.labelId,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('id', params.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      shipmentId: shipment.shipmentId,
      trackingNumber: label.trackingNumber,
      labelUrl: label.labelUrl
    })
  } catch (error) {
    console.error('Error creating shipping label:', error)
    return NextResponse.json(
      { error: 'Failed to create shipping label' },
      { status: 500 }
    )
  }
} 