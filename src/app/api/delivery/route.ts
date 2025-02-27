import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { DeliveryService } from '@/features/delivery/delivery.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const action = searchParams.get('action');
    const zipCode = searchParams.get('zipCode');
    
    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    switch (action) {
      case 'getDeliveryDays':
        const days = await DeliveryService.getDeliveryDays(zipCode);
        return NextResponse.json({ days });

      case 'getDeliveryFee':
        const subtotal = parseFloat(searchParams.get('subtotal') || '0');
        
        if (!zipCode) {
          return NextResponse.json({ error: 'ZIP code is required' }, { status: 400 });
        }

        const feeInfo = await DeliveryService.getDeliveryFeeByZipCode(zipCode, subtotal);
        return NextResponse.json(feeInfo);

      case 'getAvailableTimeSlots':
        if (!zipCode) {
          return NextResponse.json({ error: 'ZIP code is required' }, { status: 400 });
        }
        const dateStr = searchParams.get('date');
        if (!dateStr) {
          return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }
        const date = new Date(dateStr);
        const slots = await DeliveryService.getAvailableTimeSlots(date, zipCode);
        return NextResponse.json(slots);

      case 'getAvailableDates':
        if (!zipCode) {
          return NextResponse.json({ error: 'ZIP code is required' }, { status: 400 });
        }
        const startDateStr = searchParams.get('startDate');
        if (!startDateStr) {
          return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
        }
        try {
          const startDate = new Date(startDateStr);
          if (isNaN(startDate.getTime())) {
            return NextResponse.json({ error: 'Invalid start date format' }, { status: 400 });
          }
          const dates = await DeliveryService.getAvailableDates(zipCode, startDate);
          return NextResponse.json({ 
            dates,
            count: dates.length,
            zipCode,
            startDate: startDate.toISOString()
          });
        } catch (error) {
          console.error('Error in getAvailableDates:', error);
          return NextResponse.json(
            { 
              error: 'Internal server error', 
              details: error instanceof Error ? error.message : 'Unknown error',
              action: 'getAvailableDates'
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in delivery API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        action: searchParams.get('action')
      },
      { status: 500 }
    );
  }
} 