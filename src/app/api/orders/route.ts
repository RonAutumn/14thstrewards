import { createServerSupabaseClient } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { OrderType, OrderStatus, PaymentStatus, CreateOrderData } from '@/lib/supabase-orders';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderType = searchParams.get('type') as OrderType | null;
    const status = searchParams.get('status') as OrderStatus | null;
    const paymentStatus = searchParams.get('paymentStatus') as PaymentStatus | null;
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('orders')
      .select('*');

    // Apply filters if provided
    if (orderType) {
      query = query.eq('order_type', orderType);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    // Order by creation date, newest first
    query = query.order('created_at', { ascending: false });

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json() as CreateOrderData;

    // Get the current user's ID if authenticated
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Generate a unique order ID
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Validate order data based on type
    try {
      validateOrderData(body);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid order data' },
        { status: 400 }
      );
    }

    const orderData = {
      order_id: orderId,
      user_id: userId,
      ...body,
      items: JSON.stringify(body.items),
      status: body.status || 'pending',
      payment_status: body.payment_status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const body = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Ensure status and payment_status are valid enum values
    if (body.status && !isValidOrderStatus(body.status)) {
      return NextResponse.json(
        { error: 'Invalid order status' },
        { status: 400 }
      );
    }

    if (body.payment_status && !isValidPaymentStatus(body.payment_status)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in PUT /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', orderId);

    if (error) {
      console.error('Error deleting order:', error);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions to validate enum values
function isValidOrderStatus(status: string): status is OrderStatus {
  return ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'paid'].includes(status);
}

function isValidPaymentStatus(status: string): status is PaymentStatus {
  return ['pending', 'paid', 'failed', 'refunded'].includes(status);
}

// Helper function to validate order data
function validateOrderData(data: CreateOrderData): void {
  if (!data.customer_name || !data.customer_email || !data.items.length || !data.total_amount) {
    throw new Error('Missing required fields');
  }

  switch (data.order_type) {
    case 'pickup':
      if (!data.pickup_date || !data.pickup_time) {
        throw new Error('Pickup orders require pickup date and time');
      }
      break;
    case 'delivery':
      if (!data.delivery_address || !data.delivery_date || !data.delivery_time_slot) {
        throw new Error('Delivery orders require address, date, and time slot');
      }
      break;
    case 'shipping':
      if (!data.shipping_address) {
        throw new Error('Shipping orders require complete shipping address');
      }
      break;
  }
} 