import { NextResponse } from 'next/server';
import { PickupService } from '@/features/pickup/pickup.service';
import { createClient } from '@supabase/supabase-js';

// GET /api/pickup/settings?storeId={storeId}
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
    if (!settings) {
      return NextResponse.json(
        { error: 'Store settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch store settings' },
      { status: 500 }
    );
  }
}

// POST /api/pickup/settings
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { storeId, settings } = data;

    if (!storeId || !settings) {
      return NextResponse.json(
        { error: 'Store ID and settings are required' },
        { status: 400 }
      );
    }

    try {
      const updatedSettings = await PickupService.updateStoreSettings(storeId, settings);
      return NextResponse.json({ settings: updatedSettings });
    } catch (serviceError) {
      console.error('Service error:', serviceError);
      return NextResponse.json(
        { error: 'Failed to update store settings' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 