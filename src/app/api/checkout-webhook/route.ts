import { NextResponse } from 'next/server';
import { base, TABLES } from '@/lib/airtable';
import { headers } from 'next/headers';

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
        console.log('Received webhook:', payload);

        // Validate required fields
        if (!payload.orderId || !payload.status) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find the order in all tables
        const tables = [TABLES.DELIVERY_ORDERS, TABLES.SHIPPING_ORDERS, TABLES.PICKUP_ORDERS];
        let orderRecord = null;
        let tableName = '';

        for (const table of tables) {
            try {
                const records = await base(table).select({
                    filterByFormula: `{Order ID} = '${payload.orderId}'`
                }).firstPage();

                if (records.length > 0) {
                    orderRecord = records[0];
                    tableName = table;
                    console.log('Found order in table:', table);
                    break;
                }
            } catch (error) {
                console.error(`Error searching table ${table}:`, error);
            }
        }

        if (!orderRecord) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Update order status with retry logic
        const maxRetries = 2;
        let lastError = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await base(tableName).update([{
                    id: orderRecord.id,
                    fields: {
                        "Status": payload.status === 'completed' ? 'paid' : 
                            payload.status === 'failed' ? 'failed' : 'pending',
                        "Payment Method": payload.paymentMethod || 'stripe',
                        "Last Updated": new Date().toISOString(),
                        "Status Message": payload.message || '',
                        "Sister Site Verified": true,
                        "Sister Site Verification Time": new Date().toISOString(),
                        "Payment ID": payload.paymentId || '',
                        "Transaction ID": payload.transactionId || ''
                    }
                }]);

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
                    console.error('Failed to trigger status update:', await statusUpdateResponse.text());
                }

                return NextResponse.json({
                    success: true,
                    message: 'Order status updated successfully'
                });

            } catch (error) {
                console.error(`Error in webhook handler (attempt ${attempt + 1}):`, error);
                lastError = error;
                
                if (attempt < maxRetries - 1) {
                    // Wait before retrying, with exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }

        // If we get here, all retries failed
        console.error('All retry attempts failed:', lastError);
        return NextResponse.json(
            { error: 'Failed to update order status after multiple attempts' },
            { status: 500 }
        );

    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        );
    }
} 