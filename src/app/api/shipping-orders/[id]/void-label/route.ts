import { NextResponse } from 'next/server'
import { voidShippingLabel } from '@/lib/shipstation'
import { updateAirtableRecord } from '@/lib/airtable'
import { TABLES } from '@/lib/constants'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Void the shipping label in ShipStation
    await voidShippingLabel(params.id)

    // Update order in Airtable
    await updateAirtableRecord(TABLES.SHIPPING_ORDERS, params.id, {
      'Tracking Number': '',
      'Label URL': '',
      'Status': 'pending'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error voiding shipping label:', error)
    return NextResponse.json(
      { error: 'Failed to void shipping label' },
      { status: 500 }
    )
  }
} 