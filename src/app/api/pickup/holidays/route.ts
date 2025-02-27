import { NextResponse } from 'next/server';
import { PickupService } from '@/features/pickup/pickup.service';

// GET /api/pickup/holidays?storeId={storeId}
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    const settings = await PickupService.getStoreSettings(storeId);
    return NextResponse.json({ holidays: settings?.holidayDates || [] });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holidays' },
      { status: 500 }
    );
  }
}

// POST /api/pickup/holidays
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, holidays } = body;

    if (!storeId || !Array.isArray(holidays)) {
      return NextResponse.json(
        { error: 'Store ID and holidays array are required' },
        { status: 400 }
      );
    }

    const settings = await PickupService.updateHolidayDates(storeId, holidays);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating holidays:', error);
    return NextResponse.json(
      { error: 'Failed to update holidays' },
      { status: 500 }
    );
  }
} 