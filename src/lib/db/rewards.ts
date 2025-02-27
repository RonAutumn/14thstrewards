import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from './schema';
import type { Order, PointsHistory } from './schema';

export async function getUserTransactions(userId: string) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Get all points history for the user
    const { data: pointsHistory, error: pointsError } = await supabase
      .from('points_history')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (pointsError) throw pointsError;

    // Get all orders for the user
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    return {
      pointsHistory: pointsHistory as PointsHistory[],
      orders: orders as Order[],
    };
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
}

export async function createTransaction(
  userId: string,
  type: 'earned' | 'redeemed',
  points: number,
  description: string,
  orderDetails?: {
    total: number;
    pointsRedeemed?: number;
  }
) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Start by getting current user points
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const pointsUpdate = type === 'earned' ? points : -points;
    const newPoints = (userData?.points || 0) + pointsUpdate;

    // Update user's points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        points: newPoints,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Create points history entry
    const { error: historyError } = await supabase
      .from('points_history')
      .insert({
        profile_id: userId,
        points,
        type,
        description,
        created_at: new Date().toISOString(),
      });

    if (historyError) throw historyError;

    // If order details are provided, create an order
    if (orderDetails) {
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          profile_id: userId,
          total: orderDetails.total,
          points_earned: type === 'earned' ? points : 0,
          points_redeemed: orderDetails.pointsRedeemed || 0,
          created_at: new Date().toISOString(),
        });

      if (orderError) throw orderError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}
