import { NextResponse } from 'next/server'
import clientPromise from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schema/rewards'

const dbName = 'rewardsProgram'

export async function PATCH(
    request: Request,
    { params }: { params: { rewardId: string } }
) {
    try {
        const { rewardId } = params
        const { isActive } = await request.json()

        if (typeof isActive !== 'boolean') {
            return NextResponse.json({
                error: 'Invalid status value'
            }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db(dbName)

        const result = await db.collection(COLLECTIONS.REWARDS).updateOne(
            { reward_id: rewardId },
            {
                $set: {
                    isActive,
                    updatedAt: new Date()
                }
            }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({
                error: 'Reward not found'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: `Reward ${isActive ? 'activated' : 'deactivated'} successfully`
        })
    } catch (error) {
        console.error('Failed to update reward status:', error)
        return NextResponse.json({
            error: 'Failed to update reward status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 