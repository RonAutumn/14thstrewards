import { NextResponse } from 'next/server';
import { base, TABLES } from '@/lib/airtable';
import { logOrderError } from '@/lib/error-logging';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const {
            name,
            email,
            phone,
            pickupDate,
            pickupTime,
            items,
            total,
            orderId,
            paymentMethod = 'card'
        } = data;

        // Format pickup time to ensure it's in HH:mm format
        let formattedPickupTime = pickupTime;
        if (pickupTime) {
            // If time is in HHMM format, convert to HH:mm
            if (pickupTime.length === 4) {
                formattedPickupTime = `${pickupTime.slice(0, 2)}:${pickupTime.slice(2)}`;
            }
            // If time doesn't include minutes, add :00
            else if (pickupTime.length === 2) {
                formattedPickupTime = `${pickupTime}:00`;
            }
        }

        // Combine date and time for Airtable
        let pickupDateTime = null;
        if (pickupDate && formattedPickupTime) {
            pickupDateTime = new Date(`${pickupDate}T${formattedPickupTime}:00`);
        }

        // Create the pickup order in Airtable
        const record = await base(TABLES.PICKUP_ORDERS).create([
            {
                fields: {
                    'Created Time': new Date().toISOString(),
                    'Customer Name': name,
                    'Email': email,
                    'Phone': phone,
                    'Pickup Date': pickupDateTime ? pickupDateTime.toISOString() : '',
                    'Items': JSON.stringify(items),
                    'Order ID': orderId,
                    'Payment Method': paymentMethod,
                    'Status': 'pending',
                    'Total': total
                }
            }
        ]);

        // Log successful order creation
        console.info('Pickup order created successfully:', {
            orderId: orderId,
            timestamp: new Date().toISOString(),
            pickupDateTime: pickupDateTime?.toISOString()
        });

        return NextResponse.json({ success: true, recordId: record[0].id });
    } catch (error) {
        // Log the error with context
        const errorContext = {
            endpoint: 'orders/pickup',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                cause: error.cause,
            } : 'Unknown error'
        };

        logOrderError(
            error instanceof Error ? error : new Error('Unknown error occurred'),
            errorContext
        );

        console.error('Error creating pickup order:', error);

        return NextResponse.json(
            { error: 'Failed to create pickup order' },
            { status: 500 }
        );
    }
} 