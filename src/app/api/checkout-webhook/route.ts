import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { supabaseOrders } from '@/lib/supabase-orders';

// Verify webhook signature
function verifyWebhookSignature(signature: string | null, body: string): boolean {
    // TODO: Implement proper signature verification with a shared secret
    return true;
}

export async function POST(request: Request) {
    try {
        const headersList = headers();
        const signature = headersList.get('x-webhook-signature');
        const body = await request.text();

        // Verify webhook signature
        if (!verifyWebhookSignature(signature, body)) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        const payload = JSON.parse(body);
        console.log('[Checkout Webhook] Received webhook:', payload);

        // Validate required fields
        if (!payload.orderId || !payload.status) {
            console.error('[Checkout Webhook] Missing required fields:', payload);
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Update order status in Supabase
        try {
            console.log('[Checkout Webhook] Updating order status:', {
                orderId: payload.orderId,
                status: payload.status
            });

            // Map webhook status to order status
            const orderStatus = 
                payload.status === 'completed' || payload.status === 'success' ? 'completed' :
                payload.status === 'failed' || payload.status === 'error' ? 'cancelled' :
                payload.status === 'processing' ? 'processing' :
                'pending';
            
            // Map webhook status to payment status
            const paymentStatus = 
                payload.status === 'completed' || payload.status === 'success' ? 'paid' :
                payload.status === 'failed' || payload.status === 'error' ? 'failed' :
                'pending';

            console.log('[Checkout Webhook] Mapped status:', {
                originalStatus: payload.status,
                orderStatus,
                paymentStatus
            });

            // Update both order status and payment status
            await supabaseOrders.updateOrderStatus(payload.orderId, orderStatus);
            await supabaseOrders.updatePaymentStatus(payload.orderId, paymentStatus);

            // Call the checkout-status endpoint to handle email notifications
            const statusUpdateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/checkout-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: payload.orderId,
                    status: payload.status === 'completed' ? 'success' : payload.status,
                    message: payload.message
                })
            });

            if (!statusUpdateResponse.ok) {
                console.error('[Checkout Webhook] Failed to trigger status update:', await statusUpdateResponse.text());
            }

            console.log('[Checkout Webhook] Order updated successfully:', {
                orderId: payload.orderId,
                orderStatus,
                paymentStatus
            });

            return NextResponse.json({
                success: true,
                message: 'Order status updated successfully'
            });
        } catch (error) {
            console.error('[Checkout Webhook] Error updating order:', error);
            return NextResponse.json(
                { error: 'Failed to update order status' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Checkout Webhook] Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        );
    }
} 