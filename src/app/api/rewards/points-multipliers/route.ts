import { NextResponse } from 'next/server';
import { createPointsMultiplier, getAllPointsMultipliers, updatePointsMultiplier, deletePointsMultiplier } from '@/lib/db/rewards';

export async function GET() {
  try {
    const multipliers = await getAllPointsMultipliers();
    return NextResponse.json({ success: true, data: multipliers });
  } catch (error) {
    console.error('Error fetching points multipliers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch points multipliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { multiplier, startDate, endDate, description, isActive } = data;

    if (!multiplier || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const result = await createPointsMultiplier({
      multiplier: Number(multiplier),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description: description || '',
      isActive: isActive ?? true
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating points multiplier:', error);
    return NextResponse.json({ success: false, error: 'Failed to create points multiplier' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing multiplier ID' }, { status: 400 });
    }

    const result = await updatePointsMultiplier(id, updates);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating points multiplier:', error);
    return NextResponse.json({ success: false, error: 'Failed to update points multiplier' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing multiplier ID' }, { status: 400 });
    }

    const result = await deletePointsMultiplier(id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error deleting points multiplier:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete points multiplier' }, { status: 500 });
  }
} 