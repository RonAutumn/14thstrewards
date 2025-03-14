import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { DeliveryOrder } from '@/types/orders';

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

    // Fetch delivery orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'delivery')
      .order('delivery_date', { ascending: true });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Format orders to match DeliveryOrder type
    const formattedOrders: DeliveryOrder[] = orders.map(order => {
      const items = typeof order.items === 'string' 
        ? JSON.parse(order.items) 
        : order.items || [];

      const deliveryAddress = order.delivery_address || {};

      return {
        id: order.id,
        orderId: order.order_id,
        customerName: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        deliveryAddress: `${deliveryAddress.street || ''}, ${deliveryAddress.city || ''}, ${deliveryAddress.state || ''} ${deliveryAddress.zip_code || ''}`,
        city: deliveryAddress.city || '',
        state: deliveryAddress.state || '',
        zipCode: deliveryAddress.zip_code || '',
        items,
        status: order.status,
        total: parseFloat(order.total_amount) || 0,
        timestamp: order.created_at,
        type: 'delivery',
        paymentMethod: order.payment_method || '',
        deliveryDate: order.delivery_date,
        deliveryInstructions: order.delivery_instructions || ''
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error in delivery orders route:', error);
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
      console.error('Error updating delivery order:', error);
      return NextResponse.json({ error: 'Failed to update delivery order' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      record: data
    });
  } catch (error) {
    console.error('Error updating delivery order:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery order' }, 
      { status: 500 }
    );
  }
} 