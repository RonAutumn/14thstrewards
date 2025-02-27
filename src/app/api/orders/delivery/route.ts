import { NextResponse } from 'next/server';
import { base, TABLES } from '@/lib/airtable';
import { logOrderError } from '@/lib/error-logging';
import type { DeliveryOrder } from '@/types/orders';
import type { CartItem } from '@/features/cart/types';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      name,
      email,
      phone,
      address,
      zipCode,
      borough,
      instructions,
      deliveryDate,
      deliveryTime,
      items,
      total,
      deliveryFee,
      orderId,
      paymentMethod = 'card'
    } = data;

    // Validate required fields
    if (!name || !email || !phone || !address || !zipCode || !borough || !deliveryDate || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields for delivery order' },
        { status: 400 }
      );
    }

    // Validate delivery date is not in the past
    const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime || '00:00'}:00`);
    if (deliveryDateTime < new Date()) {
      return NextResponse.json(
        { error: 'Delivery date cannot be in the past' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone || formattedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Create the delivery order in Airtable
    const record = await base(TABLES.DELIVERY_ORDERS).create([
      {
        fields: {
          'Order ID': orderId,
          'Customer Name': name,
          'Email': email,
          'Phone': formattedPhone,
          'Address': address,
          'Borough': borough,
          'ZIP Code': zipCode,
          'Delivery Date': format(deliveryDateTime, 'yyyy-MM-dd'),
          'Delivery Time': deliveryTime || '',
          'Items': JSON.stringify(items),
          'Total': total,
          'Delivery Fee': deliveryFee || 0,
          'Payment Method': paymentMethod,
          'Status': 'pending',
          'Instructions': instructions || '',
          'Timestamp': format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''),
          'Last Updated': format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
        }
      }
    ]);

    // Log successful order creation
    console.info('Delivery order created successfully:', {
      orderId: orderId,
      timestamp: new Date().toISOString(),
      deliveryDateTime: deliveryDateTime.toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      recordId: record[0].id,
      orderId: orderId
    });
  } catch (error) {
    // Log the error with context
    const errorContext = {
      endpoint: 'orders/delivery',
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

    console.error('Error creating delivery order:', errorContext);

    return NextResponse.json(
      { error: 'Failed to create delivery order' },
      { status: 500 }
    );
  }
}
