import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/profile/[userId]/addresses/[addressId]
export async function PUT(
  request: Request,
  { params }: { params: { userId: string; addressId: string } }
) {
  try {
    const supabase = createClient();
    const { userId, addressId } = params;
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
        .eq('address_type', addressData.address_type)
        .neq('id', addressId);
    }

    // Update address
    const { data: address, error } = await supabase
      .from('user_addresses')
      .update({
        address_type: addressData.address_type,
        address_line1: addressData.address_line1,
        address_line2: addressData.address_line2,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code,
        is_default: addressData.is_default,
        is_verified: true, // Since we validate before saving
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId)
      .eq('user_id', userId) // Extra security check
      .select()
      .single();

    if (error) throw error;
    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'Address not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      address
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update address'
    }, { status: 500 });
  }
}

// DELETE /api/profile/[userId]/addresses/[addressId]
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string; addressId: string } }
) {
  try {
    const supabase = createClient();
    const { userId, addressId } = params;

    // Delete address
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId); // Extra security check

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete address'
    }, { status: 500 });
  }
} 