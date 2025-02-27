import { NextResponse } from 'next/server'
import { getTrackingInfo } from '@/lib/shipstation'

export async function POST(request: Request) {
  try {
    const { trackingNumber } = await request.json()
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' },
        { status: 400 }
      )
    }

    const trackingInfo = await getTrackingInfo(trackingNumber)

    return NextResponse.json(trackingInfo)
  } catch (error) {
    console.error('Error tracking package:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    )
  }
} 