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
            order_id: orderId,
            order_type: orderData.orderType,
            customer_name: `${orderData.firstName} ${orderData.lastName}`,
            customer_email: orderData.email,
            customer_phone: orderData.phone,
            items: orderData.items,
            total_amount: orderData.total,
            status: 'pending',
            payment_status: 'pending',
            payment_method: orderData.paymentMethod || 'card',

            // Type-specific fields
            ...(orderData.orderType === 'delivery' && {
                delivery_address: {
                    street: orderData.address,
                    borough: orderData.borough,
                    zip_code: orderData.zipCode
                },
                delivery_instructions: orderData.instructions,
                delivery_date: orderData.deliveryDate ? new Date(orderData.deliveryDate).toISOString() : undefined,
                delivery_time_slot: orderData.deliveryTime
            }),
            ...(orderData.orderType === 'shipping' && {
                shipping_address: {
                    street: orderData.shippingAddress,
                    city: orderData.shippingCity,
                    state: orderData.shippingState,
                    zip_code: orderData.shippingZip
                },
                shipping_cost: orderData.shippingCost
            }),
            ...(orderData.orderType === 'pickup' && {
                pickup_date: orderData.pickupDate ? new Date(orderData.pickupDate).toISOString() : undefined,
                pickup_time: orderData.pickupTime,
                pickup_notes: orderData.instructions
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