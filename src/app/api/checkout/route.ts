import { NextResponse } from 'next/server';
import axios from 'axios';
import { base, TABLES } from '@/lib/airtable';
import { format } from 'date-fns';

interface OrderAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    borough?: string;
}

interface ShippingRate {
    name: string;
    price: number;
}

interface CheckoutData {
    orderId: string;
    customerName?: string;
    customerEmail: string;
    customerPhone?: string;
    userId: string;
    items: any[];
    total: number;
    deliveryMethod: 'delivery' | 'shipping' | 'pickup';
    address: OrderAddress | null;
    deliveryDateTime?: string;
    pickupDateTime?: string;
    deliveryFee?: number;
    selectedRate?: ShippingRate;
    instructions?: string;
    paymentMethod: 'cash' | 'card';
}

export async function POST(request: Request) {
    try {
        const checkoutData = await request.json() as CheckoutData;
        console.log('Received checkout data:', checkoutData);

        // Validate required fields
        if (!checkoutData.orderId || !checkoutData.customerEmail || !checkoutData.items || !checkoutData.userId) {
            console.error('Missing required fields:', checkoutData);
            return NextResponse.json(
                { error: 'Missing required fields (orderId, customerEmail, items, or userId)' },
                { status: 400 }
            );
        }

        // For cash payments, create order directly in Airtable
        if (checkoutData.paymentMethod === 'cash') {
            let tableName: string;
            let formattedOrder: any;

            switch (checkoutData.deliveryMethod) {
                case 'delivery':
                    tableName = TABLES.DELIVERY_ORDERS;
                    formattedOrder = {
                        "Order ID": checkoutData.orderId,
                        "Customer Name": checkoutData.customerName || '',
                        "Email": checkoutData.customerEmail,
                        "Phone": checkoutData.customerPhone || '',
                        "Address": checkoutData.address?.street || '',
                        "Borough": checkoutData.address?.borough || '',
                        "ZIP Code": checkoutData.address?.zipCode || '',
                        "Delivery Date": checkoutData.deliveryDateTime ? format(new Date(checkoutData.deliveryDateTime), 'M/d/yyyy') : '',
                        "Items": JSON.stringify(checkoutData.items),
                        "Delivery Fee": checkoutData.deliveryFee || 0,
                        "Total": checkoutData.total,
                        "Status": "pending",
                        "Payment Method": "cash",
                        "Instructions": checkoutData.instructions || '',
                        "Timestamp": format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
                    };
                    break;

                case 'pickup':
                    tableName = TABLES.PICKUP_ORDERS;
                    formattedOrder = {
                        "Order ID": checkoutData.orderId,
                        "Customer Name": checkoutData.customerName || '',
                        "Email": checkoutData.customerEmail,
                        "Phone": checkoutData.customerPhone || '',
                        "Items": JSON.stringify(checkoutData.items),
                        "Total": checkoutData.total,
                        "Status": "pending",
                        "Payment Method": "cash",
                        "Pickup Date": checkoutData.pickupDateTime ? format(new Date(checkoutData.pickupDateTime), 'M/d/yyyy') : '',
                        "Timestamp": format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
                    };
                    break;

                case 'shipping':
                    tableName = TABLES.SHIPPING_ORDERS;
                    formattedOrder = {
                        "Order ID": checkoutData.orderId,
                        "Customer Name": checkoutData.customerName || '',
                        "Email": checkoutData.customerEmail,
                        "Phone": checkoutData.customerPhone || '',
                        "Address": checkoutData.address?.street || '',
                        "City": checkoutData.address?.city || '',
                        "State": checkoutData.address?.state || '',
                        "Zip Code": checkoutData.address?.zipCode || '',
                        "Items": JSON.stringify(checkoutData.items),
                        "Total": checkoutData.total,
                        "Status": "pending",
                        "Payment Method": "cash",
                        "Timestamp": format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
                    };
                    break;

                default:
                    return NextResponse.json(
                        { error: 'Invalid delivery method' },
                        { status: 400 }
                    );
            }

            try {
                // Create record in Airtable
                await base(tableName).create([{ fields: formattedOrder }]);

                return NextResponse.json({
                    redirectUrl: `/order-confirmation?orderId=${checkoutData.orderId}&orderData=${encodeURIComponent(JSON.stringify(checkoutData))}`
                });
            } catch (error) {
                console.error('Error creating Airtable record:', error);
                return NextResponse.json(
                    { error: 'Failed to create order in Airtable' },
                    { status: 500 }
                );
            }
        }

        // For card payments, create Square checkout session
        const squareResponse = await axios.post(
            `${process.env.SISTER_SITE_DOMAIN}/api/create-checkout`,
            {
                ...checkoutData,
                redirectUrl: `${process.env.NEXT_PUBLIC_DOMAIN}/success?orderId=${checkoutData.orderId}&orderData=${encodeURIComponent(JSON.stringify(checkoutData))}`
            }
        );

        return NextResponse.json(squareResponse.data);
    } catch (error) {
        console.error('Error processing checkout:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process checkout' },
            { status: 500 }
        );
    }
} 