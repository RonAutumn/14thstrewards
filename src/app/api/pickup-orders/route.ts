import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { PickupOrder } from '@/types/orders';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify admin authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch pickup orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'pickup')
      .order('pickup_date', { ascending: true });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Format orders to match PickupOrder type
    const formattedOrders: PickupOrder[] = orders.map(order => ({
      id: order.id,
      orderId: order.order_id,
      customerName: order.customer_name,
      email: order.customer_email,
      phone: order.customer_phone,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [],
      status: order.status,
      total: parseFloat(order.total_amount) || 0,
      timestamp: order.created_at,
      type: 'pickup',
      pickupDate: order.pickup_date,
      pickupTime: order.pickup_time,
      pickupNotes: order.pickup_notes || '',
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error in pickup orders route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id, status, lastUpdated } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: id and status' },
        { status: 400 }
      );
    }
    
    // Update the order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: status,
        updated_at: lastUpdated || new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating pickup order:', error);
      return NextResponse.json({ error: 'Failed to update pickup order' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      record: data
    });
  } catch (error) {
    console.error('Error updating pickup order:', error);
    return NextResponse.json(
      { error: 'Failed to update pickup order' }, 
      { status: 500 }
    );
  }
} 