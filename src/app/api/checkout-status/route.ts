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

        // Update order status in Supabase if payment is confirmed
        if (status === 'paid' || status === 'completed' || status === 'success') {
            try {
                // Update order status and payment status in Supabase
                await supabaseOrders.updateOrderStatus(orderId, 'confirmed');
                await supabaseOrders.updatePaymentStatus(orderId, 'paid');

                // Calculate points (this logic should be moved to a separate service)
                const pointsEarned = Math.floor(orderData.total);
                const totalPoints = (orderData.currentPoints || 0) + pointsEarned;
                const pendingPoints = 0; // Card payments are confirmed immediately

                return {
                    success: true,
                    message: 'Order updated and completed',
                    orderId,
                    orderData: {
                        ...orderData,
                        pointsEarned,
                        totalPoints,
                        pendingPoints,
                        status: 'completed'
                    }
                };
            } catch (error) {
                console.error('Supabase error:', error);
                return {
                    success: false,
                    message: 'Failed to update order in Supabase',
                    orderId
                };
            }
        } else if (status === 'failed' || status === 'cancelled') {
            try {
                // Update order status and payment status for failed payments
                await supabaseOrders.updateOrderStatus(orderId, 'cancelled');
                await supabaseOrders.updatePaymentStatus(orderId, 'failed');

                return {
                    success: true,
                    message: 'Order marked as cancelled',
                    orderId,
                    orderData: {
                        ...orderData,
                        status: 'cancelled'
                    }
                };
            } catch (error) {
                console.error('Supabase error:', error);
                return {
                    success: false,
                    message: 'Failed to update order status',
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