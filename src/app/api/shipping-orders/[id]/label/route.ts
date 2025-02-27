import { NextResponse } from 'next/server'
import { createShippingLabel } from '@/lib/shipstation'
import { updateAirtableRecord } from '@/lib/airtable'
import { TABLES } from '@/lib/constants'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rateId } = await request.json()
    
    // Create shipping label using ShipStation
    const label = await createShippingLabel(params.id, rateId)

    // Update order in Airtable with tracking info
    await updateAirtableRecord(TABLES.SHIPPING_ORDERS, params.id, {
      'Tracking Number': label.trackingNumber,
      'Label URL': label.labelUrl,
      'Status': 'processing'
    })

    return NextResponse.json({
      success: true,
      trackingNumber: label.trackingNumber,
      labelUrl: label.labelUrl
    })
  } catch (error) {
    console.error('Error creating shipping label:', error)
    return NextResponse.json(
      { error: 'Failed to create shipping label' },
      { status: 500 }
    )
  }
} 