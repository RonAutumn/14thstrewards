import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { COLLECTIONS, DB_NAME } from '@/lib/db/schema/rewards';

export async function POST(request: Request) {
    try {
        const user = await request.json();
        console.log('Looking up rewards user by supabaseId:', user.id);

        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Look up user by supabaseId
        const existingUser = await db.collection(COLLECTIONS.USERS).findOne({
            supabaseId: user.id
        });

        console.log('Lookup result:', existingUser ? {
            _id: existingUser._id,
            email: existingUser.email,
            supabaseId: existingUser.supabaseId,
            points: existingUser.points
        } : 'No existing user found');

        if (existingUser) {
            // Update login info for existing user
            const updateResult = await db.collection(COLLECTIONS.USERS).updateOne(
                { _id: existingUser._id },
                {
                    $set: {
                        lastLogin: new Date(),
                        updatedAt: new Date(),
                        provider: user.provider || existingUser.provider || 'google',
                        emailVerified: user.email_confirmed_at ? true : existingUser.emailVerified,
                        email: user.email, // Keep email up to date
                        name: user.name // Keep name up to date
                    },
                    $inc: { loginCount: 1 }
                }
            );

            // Return the updated user
            const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: existingUser._id });
            if (!updatedUser) {
                throw new Error('Failed to fetch updated user');
            }

            console.log('Returning updated existing user:', {
                _id: updatedUser._id,
                supabaseId: updatedUser.supabaseId,
                email: updatedUser.email
            });

            return NextResponse.json({ user: updatedUser });
        }

        // If no user found, create a new one
        console.log('Creating new user in rewards system:', user.id);
        const newUser = {
            supabaseId: user.id,
            email: user.email,
            name: user.name || user.email?.split('@')[0] || 'Unknown',
            points: 0,
            membershipLevel: 'Bronze',
            provider: user.provider || 'google',
            emailVerified: user.email_confirmed_at ? true : false,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin: new Date(),
            loginCount: 1
        };

        const insertResult = await db.collection(COLLECTIONS.USERS).insertOne(newUser);
        if (!insertResult.acknowledged) {
            throw new Error('Failed to create user');
        }

        const createdUser = await db.collection(COLLECTIONS.USERS).findOne({ _id: insertResult.insertedId });
        if (!createdUser) {
            throw new Error('Failed to fetch created user');
        }

        console.log('Successfully created new user:', {
            _id: createdUser._id,
            supabaseId: createdUser.supabaseId,
            email: createdUser.email
        });

        return NextResponse.json({ user: createdUser });
    } catch (error) {
        console.error('Error in rewards user creation:', error);
        return NextResponse.json(
            { error: 'Failed to process rewards user' },
            { status: 500 }
        );
    }
} 