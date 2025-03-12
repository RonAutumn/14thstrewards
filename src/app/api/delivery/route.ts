import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DeliveryService } from '@/features/delivery/delivery.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  try {
    const action = searchParams.get('action');
    const zipCode = searchParams.get('zipCode');
    
    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    switch (action) {
      case 'getDeliveryDays':
        try {
          const days = await DeliveryService.getDeliveryDays(zipCode);
          return NextResponse.json({ days });
        } catch (error) {
          if (error instanceof Error && error.message.includes('No delivery fee configuration found')) {
            return NextResponse.json({ 
              error: 'Delivery not available',
              details: `We do not currently deliver to zip code ${zipCode}`,
              zipCode 
            }, { status: 404 });
          }
          throw error;
        }

      case 'getDeliveryFee':
        const subtotal = parseFloat(searchParams.get('subtotal') || '0');
        
        if (!zipCode) {
          return NextResponse.json({ error: 'ZIP code is required' }, { status: 400 });
        }

        try {
          const feeInfo = await DeliveryService.getDeliveryFeeByZipCode(zipCode, subtotal);
          return NextResponse.json(feeInfo);
        } catch (error) {
          if (error instanceof Error && error.message.includes('No delivery fee configuration found')) {
            return NextResponse.json({ 
              error: 'Delivery not available',
              details: `We do not currently deliver to zip code ${zipCode}`,
              zipCode 
            }, { status: 404 });
          }
          console.error('Error getting delivery fee:', error);
          return NextResponse.json({ 
            error: 'Failed to calculate delivery fee',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }

      case 'getAvailableTimeSlots':
        if (!zipCode) {
          return NextResponse.json({ error: 'ZIP code is required' }, { status: 400 });
        }
        const dateStr = searchParams.get('date');
        if (!dateStr) {
          return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }
        const date = new Date(dateStr);
        try {
          const slots = await DeliveryService.getAvailableTimeSlots(date, zipCode);
          return NextResponse.json(slots);
        } catch (error) {
          if (error instanceof Error && error.message.includes('No delivery fee configuration found')) {
            return NextResponse.json({ 
              error: 'Delivery not available',
              details: `We do not currently deliver to zip code ${zipCode}`,
              zipCode 
            }, { status: 404 });
          }
          throw error;
        }

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
          
          console.log('Fetching available dates for:', { zipCode, startDate: startDate.toISOString() });
          const dates = await DeliveryService.getAvailableDates(zipCode, startDate);
          
          // Ensure dates are properly formatted as ISO strings
          const formattedDates = dates.map(date => {
            // Create a new date at midnight in local time
            const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            return localDate.toISOString();
          });

          console.log('Sending dates to client:', {
            count: formattedDates.length,
            dates: formattedDates,
          });

          return NextResponse.json({ 
            dates: formattedDates,
            count: formattedDates.length,
            zipCode,
            startDate: startDate.toISOString()
          });
        } catch (error) {
          console.error('Error in getAvailableDates:', error);
          
          if (error instanceof Error && error.message.includes('No delivery fee configuration found')) {
            return NextResponse.json({ 
              error: 'Delivery not available',
              details: `We do not currently deliver to zip code ${zipCode}`,
              zipCode,
              dates: []
            }, { status: 404 });
          }
          
          return NextResponse.json({ 
            error: 'Failed to fetch available dates',
            details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
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