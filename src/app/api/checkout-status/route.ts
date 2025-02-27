import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { supabaseOrders } from '@/lib/supabase-orders';
import type { CreateOrderData } from '@/lib/supabase-orders';

interface OrderStatusResponse {
    success: boolean;
    message: string;
    orderId: string;
    orderData?: any;
}

interface OrderStatusRequest {
    orderId: string;
    status: string;
    message?: string;
}

interface AirtableError {
    error: string;
    message: string;
    statusCode: number;
}

// Add interface for confirm order response
interface ConfirmOrderResponse {
    success: boolean;
    message: string;
    pointsEarned?: number;
    totalPoints?: number;
    orderId: string;
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
    return NextResponse.json({
        success: true,
        message: 'OK'
    } as OrderStatusResponse, {
        headers: {
            'Access-Control-Allow-Origin': process.env.SISTER_SITE_DOMAIN || 'localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Source-App',
            'Access-Control-Allow-Credentials': 'true'
        }
    });
}

// Add CORS headers helper
function addCorsHeaders(response: Response): Response {
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', process.env.SISTER_SITE_DOMAIN || 'localhost:3001');
    headers.set('Access-Control-Allow-Credentials', 'true');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

// Handle GET requests for success redirects
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const orderId = url.searchParams.get('orderId');
        const status = url.searchParams.get('status') || 'success';
        const orderDataStr = url.searchParams.get('orderData');

        if (!orderId || !orderDataStr) {
            return addCorsHeaders(NextResponse.json({
                success: false,
                message: 'Missing order ID or order data',
                orderId: ''
            } as OrderStatusResponse, { status: 400 }));
        }

        const orderData = JSON.parse(decodeURIComponent(orderDataStr));
        const result = await updateOrderStatus(orderId, status, orderData);

        if (!result.success) {
            return addCorsHeaders(NextResponse.json({
                success: false,
                message: result.message,
                orderId
            } as OrderStatusResponse, { status: 500 }));
        }

        return addCorsHeaders(NextResponse.json(result));
    } catch (error) {
        console.error('Error processing success callback:', error);
        return addCorsHeaders(NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            orderId: ''
        } as OrderStatusResponse, { status: 500 }));
    }
}

// Handle POST requests for webhook updates
export async function POST(request: Request) {
    try {
        const { orderId, status, orderData } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const response = await updateOrderStatus(orderId, status, orderData);
        return NextResponse.json(response);
    } catch (error) {
        console.error('Error processing checkout status:', error);
        return NextResponse.json(
            { error: 'Failed to process checkout status' },
            { status: 500 }
        );
    }
}

// Helper function to update order status
async function updateOrderStatus(orderId: string, status: string, orderData: any): Promise<OrderStatusResponse> {
    try {
        console.log('Processing order status:', { orderId, status, orderData });

        // Only create Supabase record if payment is confirmed
        if (status === 'paid' || status === 'completed' || status === 'success') {
            const { deliveryMethod, paymentMethod } = orderData;

            // Format order data for Supabase
            const formattedOrderData: CreateOrderData = {
                order_type: deliveryMethod,
                customer_name: orderData.customerName || '',
                customer_email: orderData.customerEmail,
                customer_phone: orderData.customerPhone || '',
                items: orderData.items,
                subtotal: orderData.subtotal || orderData.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                total: orderData.total,
                payment_method: paymentMethod || 'card',
                instructions: orderData.instructions,

                // Type-specific fields
                ...(deliveryMethod === 'delivery' && {
                    address: orderData.address?.street || '',
                    borough: orderData.address?.borough || '',
                    zip_code: orderData.address?.zipCode || '',
                    delivery_fee: orderData.deliveryFee || 0
                }),
                ...(deliveryMethod === 'shipping' && {
                    address: orderData.shippingAddress,
                    city: orderData.shippingCity,
                    state: orderData.shippingState,
                    zip_code: orderData.shippingZip
                }),
                ...(deliveryMethod === 'pickup' && {
                    pickup_date: orderData.pickupDate && new Date(orderData.pickupDate),
                    pickup_time: orderData.pickupTime
                })
            };

            try {
                // Create order in Supabase
                const order = await supabaseOrders.createOrder(formattedOrderData);

                // Calculate points (this logic should be moved to a separate service)
                const pointsEarned = Math.floor(orderData.total);
                const totalPoints = (orderData.currentPoints || 0) + pointsEarned;
                const pendingPoints = paymentMethod === 'cash' ? pointsEarned : 0;

                return {
                    success: true,
                    message: paymentMethod === 'cash' ? 'Cash order created (pending)' : 'Order created and completed',
                    orderType: deliveryMethod,
                    orderId,
                    orderData: {
                        ...orderData,
                        pointsEarned,
                        totalPoints,
                        pendingPoints,
                        status: paymentMethod === 'cash' ? 'pending' : 'completed'
                    }
                };
            } catch (error) {
                console.error('Supabase error:', error);
                return {
                    success: false,
                    message: 'Failed to create order in Supabase',
                    orderId
                };
            }
        }

        // For non-confirmed statuses, just return success
        return {
            success: true,
            message: 'Order status acknowledged',
            orderId,
            orderData
        };
    } catch (error) {
        console.error('Error updating order status:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            orderId
        };
    }
} 