import { NextResponse } from 'next/server';
import { PickupService } from '@/features/pickup/pickup.service';

// GET /api/pickup/special-hours?storeId={storeId}
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
    return NextResponse.json({ specialHours: settings?.specialHours || [] });
  } catch (error) {
    console.error('Error fetching special hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch special hours' },
      { status: 500 }
    );
  }
}

// POST /api/pickup/special-hours
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, specialHours } = body;

    if (!storeId || !Array.isArray(specialHours)) {
      return NextResponse.json(
        { error: 'Store ID and special hours array are required' },
        { status: 400 }
      );
    }

    const settings = await PickupService.updateSpecialHours(storeId, specialHours);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating special hours:', error);
    return NextResponse.json(
      { error: 'Failed to update special hours' },
      { status: 500 }
    );
  }
} 