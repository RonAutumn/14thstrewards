import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { DeliveryOrder } from '@/types/orders';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const orderId = searchParams.get('orderId');
    
    // Start building the query
    let query = supabase
      .from('orders')
      .select('*')
      .eq('order_type', 'delivery');
    
    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (orderId) {
      query = query.eq('order_id', orderId);
    }
    
    if (startDate && endDate) {
      query = query.gte('delivery_date', startDate).lte('delivery_date', endDate);
    } else if (startDate) {
      query = query.gte('delivery_date', startDate);
    } else if (endDate) {
      query = query.lte('delivery_date', endDate);
    }
    
    // Order by delivery date, newest first
    query = query.order('created_at', { ascending: false });
    
    const { data: orders, error } = await query;
    
    if (error) {
      console.error('Error fetching delivery orders:', error);
      return NextResponse.json({ error: 'Failed to fetch delivery orders' }, { status: 500 });
    }
    
    // Transform orders to match the expected format in the frontend
    const formattedOrders = orders.map(order => {
      try {
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
          address: deliveryAddress.street || '',
          borough: deliveryAddress.borough || '',
          zipCode: deliveryAddress.zip_code || '',
          deliveryDate: order.delivery_date,
          deliveryTime: order.delivery_time_slot || '',
          items: items,
          total: parseFloat(order.total_amount) || 0,
          deliveryFee: parseFloat(order.shipping_cost) || 0,
          paymentMethod: order.payment_method,
          status: order.status,
          instructions: order.delivery_instructions || '',
          timestamp: order.created_at,
          lastUpdated: order.updated_at
        };
      } catch (error) {
        console.error('Error parsing order data:', error, order);
        return null;
      }
    }).filter(Boolean) as DeliveryOrder[];
    
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery orders' }, 
      { status: 500 }
    );
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