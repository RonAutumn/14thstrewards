import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { COLLECTIONS, DB_NAME } from '@/lib/db/schema/rewards';

// PATCH /api/rewards/tiers/[tierId]
export async function PATCH(
    request: Request,
    { params }: { params: { tierId: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const updates = await request.json();

        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.tier_id;
        delete updates.createdAt;

        const result = await db.collection(COLLECTIONS.TIERS).updateOne(
            { tier_id: params.tierId },
            { 
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'Tier not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update tier:', error);
        return NextResponse.json(
            { error: 'Failed to update tier' },
            { status: 500 }
        );
    }
}

// DELETE /api/rewards/tiers/[tierId]
export async function DELETE(
    request: Request,
    { params }: { params: { tierId: string } }
) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const result = await db.collection(COLLECTIONS.TIERS).deleteOne({ tier_id: params.tierId });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Tier not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete tier:', error);
        return NextResponse.json(
            { error: 'Failed to delete tier' },
            { status: 500 }
        );
    }
} 