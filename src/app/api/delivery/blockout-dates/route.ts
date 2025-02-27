import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/delivery/blockout-dates
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('includeExpired') === 'true';

    let query = supabase
      .from('delivery_blockout_dates')
      .select('*')
      .order('date', { ascending: true });

    if (!includeExpired) {
      query = query.gte('date', new Date().toISOString());
    }

    const { data: dates, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      dates
    });
  } catch (error) {
    console.error('Failed to fetch blockout dates:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch blockout dates'
    }, { status: 500 });
  }
}

// POST /api/delivery/blockout-dates
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const data = await request.json();

    const { data: date, error } = await supabase
      .from('delivery_blockout_dates')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      date
    });
  } catch (error) {
    console.error('Failed to create blockout date:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create blockout date'
    }, { status: 500 });
  }
}

// DELETE /api/delivery/blockout-dates?id={id}
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID is required'
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('delivery_blockout_dates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Failed to delete blockout date:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete blockout date'
    }, { status: 500 });
  }
} 