import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const data = await request.json();

        // Validate required fields
        if (!data.orderId || !data.userId) {
            return NextResponse.json({
                success: false,
                error: 'Order ID and User ID are required'
            }, { status: 400 });
        }

        // Update order status
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .update({
                status: 'confirmed',
                updated_at: new Date().toISOString()
            })
            .eq('id', data.orderId)
            .select()
            .single();

        if (orderError) throw orderError;
        if (!order) {
            return NextResponse.json({
                success: false,
                error: 'Order not found'
            }, { status: 404 });
        }

        // Update user points if applicable
        if (order.points_earned) {
            const { error: pointsError } = await supabase
                .from('profiles')
                .update({
                    points: supabase.sql`points + ${order.points_earned}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', data.userId);

            if (pointsError) throw pointsError;
        }

        // Create points transaction record
        if (order.points_earned) {
            const { error: transactionError } = await supabase
                .from('points_transactions')
                .insert({
                    user_id: data.userId,
                    points: order.points_earned,
                    type: 'earned',
                    source: 'order',
                    source_id: order.id,
                    created_at: new Date().toISOString()
                });

            if (transactionError) throw transactionError;
        }

        return NextResponse.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Failed to confirm order:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to confirm order'
        }, { status: 500 });
    }
} 