import { NextResponse } from 'next/server';
import { PickupService } from '@/features/pickup/pickup.service';

// GET /api/pickup/slots?storeId={storeId}&date={date}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const dateStr = searchParams.get('date');

    console.log('Received request for slots:', { storeId, dateStr });

    if (!storeId || !dateStr) {
      return NextResponse.json(
        { error: 'Store ID and date are required' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    console.log('Parsed date:', date);
    
    // Get store settings first
    const settings = await PickupService.getStoreSettings(storeId);
    console.log('Retrieved store settings:', settings);

    if (!settings) {
      return NextResponse.json(
        { error: 'Store settings not found' },
        { status: 404 }
      );
    }

    // Check if pickup is enabled
    if (!settings.is_pickup_enabled) {
      console.log('Pickup is disabled');
      return NextResponse.json({ slots: [] });
    }

    // Get day schedule
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = settings.schedule.find(s => s.day_of_week === dayOfWeek);
    console.log('Day schedule:', { dayOfWeek, daySchedule });
    
    // If day is not in schedule or not open, return empty slots
    if (!daySchedule || !daySchedule.is_open) {
      console.log('Day is not open for pickup');
      return NextResponse.json({ slots: [] });
    }

    // Generate slots based on store settings
    const slots = await PickupService.generateTimeSlotsForDay(storeId, date);
    console.log('Generated slots:', slots);

    // Transform slots to match frontend expectations
    const transformedSlots = slots.map(slot => ({
      startTime: slot.startTime || slot.start_time,
      endTime: slot.endTime || slot.end_time,
      maxOrders: slot.maxOrders || slot.max_orders,
      currentOrders: slot.currentOrders || slot.current_orders,
      isAvailable: slot.isAvailable || slot.is_available
    }));
    
    return NextResponse.json({ slots: transformedSlots });
  } catch (error) {
    console.error('Error generating pickup slots:', error);
    return NextResponse.json(
      { error: 'Failed to generate pickup slots' },
      { status: 500 }
    );
  }
}

// POST /api/pickup/slots
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, date, startTime, endTime, increment } = body;

    if (!storeId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Store ID, date, start time, and end time are required' },
        { status: 400 }
      );
    }

    const settings = await PickupService.updateTimeSlotAvailability(
      storeId,
      new Date(date),
      startTime,
      endTime,
      increment
    );

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating pickup slot:', error);
    return NextResponse.json(
      { error: 'Failed to update pickup slot' },
      { status: 500 }
    );
  }
} 