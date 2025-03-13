import { NextResponse } from 'next/server';
import axios from 'axios';
import { format } from 'date-fns';
import { supabaseOrders } from '@/lib/supabase-orders';

interface OrderAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
}

interface CheckoutData {
    orderId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    userId?: string;
    items: any[];
    total: number;
    deliveryMethod: 'pickup' | 'delivery' | 'shipping';
    address?: OrderAddress | null;
    deliveryDateTime?: string;
    pickupDateTime?: string;
    selectedRate?: any;
    instructions?: string;
    paymentMethod: 'card';
}

export async function POST(request: Request) {
    try {
        console.log('[Checkout API] Received checkout request');
        
        if (!process.env.SISTER_SITE_URL) {
            console.error('[Checkout API] SISTER_SITE_URL is not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const data: CheckoutData = await request.json();
        
        // Validate required fields
        if (!data.customerName || !data.customerEmail || !data.items?.length || !data.total) {
            console.error('[Checkout API] Missing required fields:', {
                hasName: Boolean(data.customerName),
                hasEmail: Boolean(data.customerEmail),
                hasItems: Boolean(data.items?.length),
                hasTotal: Boolean(data.total)
            });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('[Checkout API] Creating Stripe checkout session with data:', {
            customerEmail: data.customerEmail,
            itemCount: data.items.length,
            total: data.total,
            deliveryMethod: data.deliveryMethod
        });

        // Create Stripe checkout session through sister site
        console.log('[Checkout API] Attempting to connect to:', process.env.SISTER_SITE_URL);
        
        const payload = {
            orderId: data.orderId,
            customerEmail: data.customerEmail,
            amount: Math.round(data.total * 100), // Convert dollars to cents
            items: data.items,
            metadata: {
                orderId: data.orderId,
                customerName: data.customerName,
                deliveryMethod: data.deliveryMethod,
                ...(data.address && { address: JSON.stringify(data.address) }),
                ...(data.deliveryDateTime && { deliveryDateTime: data.deliveryDateTime }),
                ...(data.pickupDateTime && { pickupDateTime: data.pickupDateTime })
            }
        };

        const stripeResponse = await axios({
            method: 'post',
            url: `${process.env.SISTER_SITE_URL}/api/checkout`,
            data: payload,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Sister-Site-Secret': process.env.SISTER_SITE_SECRET || '',
                'X-Source-App': 'rewards'
            },
            validateStatus: function (status) {
                return status >= 200 && status < 500; // Accept any status code less than 500
            }
        });

        console.log('[Checkout API] Received response from sister site:', {
            status: stripeResponse.status,
            data: stripeResponse.data,
            hasUrl: Boolean(stripeResponse.data?.url)
        });

        if (!stripeResponse.data?.url) {
            console.error('[Checkout API] Invalid response from sister site:', {
                responseData: stripeResponse.data,
                status: stripeResponse.status
            });
            return NextResponse.json(
                { error: 'Failed to create Stripe checkout session: No URL received' },
                { status: 500 }
            );
        }

        console.log('[Checkout API] Successfully created Stripe checkout session:', {
            hasUrl: Boolean(stripeResponse.data.url),
            orderId: data.orderId
        });

        return NextResponse.json({
            redirectUrl: stripeResponse.data.url,
            orderId: data.orderId
        });
    } catch (error) {
        console.error('[Checkout API] Error processing checkout:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        
        return NextResponse.json(
            { error: 'Failed to process checkout' },
            { status: 500 }
        );
    }
} 