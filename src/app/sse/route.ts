import { NextResponse } from 'next/server'

export async function GET() {
  // Return 200 OK to prevent 404 logs
  return new NextResponse(null, { status: 200 })
}
