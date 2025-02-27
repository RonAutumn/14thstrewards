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
    const { membershipLevel } = await request.json()

    console.log('Membership update request received for:', params.userId);

    // First check if user exists using both identifiers
    const user = await db.collection(COLLECTIONS.USERS).findOne({
      $or: [
        { userId: params.userId },
        { supabaseId: params.userId }
      ]
    });

    if (!user) {
      console.log('User not found for membership update:', params.userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('Updating membership for user:', {
      userId: user.userId,
      currentLevel: user.membershipLevel,
      newLevel: membershipLevel
    });

    // Update membership for existing user
    await db.collection(COLLECTIONS.USERS).updateOne(
      { _id: user._id },
      { 
        $set: { 
          membershipLevel,
          updatedAt: new Date()
        }
      }
    )

    const updatedUser = await db.collection(COLLECTIONS.USERS)
      .findOne({ _id: user._id })

    console.log('Membership updated successfully:', {
      userId: updatedUser?.userId,
      newLevel: updatedUser?.membershipLevel
    });

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Failed to update user membership:', error)
    return NextResponse.json(
      { error: 'Failed to update user membership' },
      { status: 500 }
    )
  }
} 