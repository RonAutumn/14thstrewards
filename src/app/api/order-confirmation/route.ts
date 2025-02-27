import { NextResponse } from 'next/server';
import { supabaseOrders } from '@/lib/supabase-orders';
import type { CreateOrderData } from '@/lib/supabase-orders';

export async function POST(request: Request) {
    try {
        const { orderId, orderData, sessionId } = await request.json();

        if (!orderId || !orderData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Format order data for Supabase
        const formattedOrderData: CreateOrderData = {
            order_type: orderData.orderType,
            customer_name: `${orderData.firstName} ${orderData.lastName}`,
            customer_email: orderData.email,
            customer_phone: orderData.phone,
            items: orderData.items,
            subtotal: orderData.subtotal,
            total: orderData.total,
            payment_method: orderData.paymentMethod || 'card',
            instructions: orderData.instructions,

            // Type-specific fields
            ...(orderData.orderType === 'delivery' && {
                address: orderData.address,
                borough: orderData.borough,
                zip_code: orderData.zipCode,
                delivery_fee: orderData.deliveryFee
            }),
            ...(orderData.orderType === 'shipping' && {
                address: orderData.shippingAddress,
                city: orderData.shippingCity,
                state: orderData.shippingState,
                zip_code: orderData.shippingZip
            }),
            ...(orderData.orderType === 'pickup' && {
                pickup_date: orderData.pickupDate && new Date(orderData.pickupDate),
                pickup_time: orderData.pickupTime
            })
        };

        // Create order in Supabase
        const order = await supabaseOrders.createOrder(formattedOrderData);

        return NextResponse.json({
            success: true,
            orderId: order.order_id,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            {
                error: 'Failed to create order',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 