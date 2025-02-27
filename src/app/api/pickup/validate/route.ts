import { NextResponse } from 'next/server';
import { PickupService } from '@/features/pickup/pickup.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, date, startTime, endTime } = body;

    if (!storeId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Store ID, date, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate the time slot
    await PickupService.validateTimeSlot(
      storeId,
      new Date(date),
      startTime,
      endTime
    );

    // Get current capacity
    const capacity = await PickupService.getTimeSlotCapacity(
      storeId,
      new Date(date),
      startTime,
      endTime
    );

    return NextResponse.json({ 
      valid: true,
      capacity
    });
  } catch (error) {
    console.error('Error validating pickup slot:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate pickup slot'
      },
      { status: 400 }
    );
  }
} 