import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/profile/[userId]/addresses
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { userId } = params;

    const { data: addresses, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch addresses'
    }, { status: 500 });
  }
}

// POST /api/profile/[userId]/addresses
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createClient();
    const { userId } = params;
    const addressData = await request.json();

    // Validate required fields
    if (!addressData.address_line1 || !addressData.city || !addressData.state || !addressData.zip_code) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // If this is set as default, unset any existing default of the same type
    if (addressData.is_default) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('address_type', addressData.address_type);
    }

    // Insert new address
    const { data: address, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id: userId,
        address_type: addressData.address_type,
        address_line1: addressData.address_line1,
        address_line2: addressData.address_line2,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code,
        is_default: addressData.is_default,
        is_verified: true // Since we validate before saving
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      address
    });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create address'
    }, { status: 500 });
  }
} 