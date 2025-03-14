import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rewardsService } from '@/features/rewards/rewards.service';

export async function POST(request: Request) {
  try {
    const { orderId, status, paymentStatus } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Update both status and payment_status
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: status || 'completed',
        payment_status: paymentStatus || 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // If order is completed and paid, add points
    if (order && order.status === 'completed' && order.payment_status === 'paid' && order.user_id) {
      try {
        // Calculate points based on items total only, not including delivery or shipping fees
        const itemsTotal = order.items.reduce((sum, item) => sum + (item.total || 0), 0);
        
        // Get user profile to determine tier
        const userProfile = await rewardsService.getUserProfile(order.user_id);
        const points = rewardsService.calculateEstimatedPoints(
          itemsTotal,
          userProfile?.membership_level || 'BRONZE'
        );

        // Add points to user's account
        if (points > 0) {
          const description = `Points earned from order #${order.order_id} (${Math.floor(itemsTotal * 10)} base points × ${userProfile?.membership_level || 'BRONZE'} multiplier)`;
          await rewardsService.addPoints(order.user_id, points, description);
        }
      } catch (pointsError) {
        console.error('Error adding points:', pointsError);
        // Don't fail the request if points addition fails
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error in update-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 