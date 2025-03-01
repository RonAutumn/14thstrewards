import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

// GET /api/rewards/users
export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookies() })

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      users
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 