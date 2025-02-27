import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/rewards/[rewardId]
export async function GET(
    request: Request,
    { params }: { params: { rewardId: string } }
) {
    try {
        const supabase = createClient()
        const { rewardId } = params

        const { data: reward, error } = await supabase
            .from('rewards')
            .select('*')
            .or(`id.eq.${rewardId},reward_id.eq.${rewardId}`)
            .single()

        if (error) throw error
        if (!reward) {
            return NextResponse.json({
                success: false,
                error: 'Reward not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            reward
        })
    } catch (error) {
        console.error('Failed to fetch reward:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch reward'
        }, { status: 500 })
    }
}

// PATCH /api/rewards/[rewardId]
export async function PATCH(
    request: Request,
    { params }: { params: { rewardId: string } }
) {
    try {
        const supabase = createClient()
        const { rewardId } = params
        const updates = await request.json()

        const { data: reward, error } = await supabase
            .from('rewards')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .or(`id.eq.${rewardId},reward_id.eq.${rewardId}`)
            .select()
            .single()

        if (error) throw error
        if (!reward) {
            return NextResponse.json({
                success: false,
                error: 'Reward not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            reward
        })
    } catch (error) {
        console.error('Failed to update reward:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to update reward'
        }, { status: 500 })
    }
}

// DELETE /api/rewards/[rewardId]
export async function DELETE(
    request: Request,
    { params }: { params: { rewardId: string } }
) {
    try {
        const supabase = createClient()
        const { rewardId } = params

        const { error } = await supabase
            .from('rewards')
            .delete()
            .or(`id.eq.${rewardId},reward_id.eq.${rewardId}`)

        if (error) throw error

        return NextResponse.json({
            success: true
        })
    } catch (error) {
        console.error('Failed to delete reward:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to delete reward'
        }, { status: 500 })
    }
} 