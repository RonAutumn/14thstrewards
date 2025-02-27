import { NextResponse } from 'next/server'
import clientPromise from '@/lib/db'
import { COLLECTIONS, DB_NAME } from '@/lib/db/schema/rewards'

export async function PATCH(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const client = await clientPromise
        const db = client.db(DB_NAME)
        const { points } = await request.json()

        console.log('Points update request received for:', params.userId);

        // First check if user exists using both identifiers
        const user = await db.collection(COLLECTIONS.USERS).findOne({
            $or: [
                { userId: params.userId },
                { supabaseId: params.userId }
            ]
        });

        if (!user) {
            console.log('User not found for points update:', params.userId);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        console.log('Updating points for user:', {
            userId: user.userId,
            currentPoints: user.points,
            pointsToAdd: points
        });

        // Update points for existing user
        await db.collection(COLLECTIONS.USERS).updateOne(
            { _id: user._id },
            {
                $inc: { points: Number(points) },
                $set: {
                    updatedAt: new Date()
                }
            }
        )

        const updatedUser = await db.collection(COLLECTIONS.USERS)
            .findOne({ _id: user._id })

        console.log('Points updated successfully:', {
            userId: updatedUser?.userId,
            newPoints: updatedUser?.points
        });

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Failed to update user points:', error)
        return NextResponse.json(
            { error: 'Failed to update user points' },
            { status: 500 }
        )
    }
} 