import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocode'

export async function POST(req: NextRequest) {
  const { address } = await req.json()
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 })

  const result = await geocodeAddress(address)
  if (!result) return NextResponse.json({ error: 'geocoding failed' }, { status: 422 })

  return NextResponse.json(result)
}
