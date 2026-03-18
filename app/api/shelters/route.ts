import { NextRequest, NextResponse } from 'next/server'
import { getNearestShelters, getNearestAirRaidShelters, getNearestMedical } from '@/lib/shelters'

export async function POST(req: NextRequest) {
  const { lat, lng, city } = await req.json()

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })
  }

  const [shelters, airRaid, medical] = await Promise.all([
    getNearestShelters(lat, lng, city ?? ''),
    getNearestAirRaidShelters(lat, lng),
    getNearestMedical(lat, lng),
  ])

  return NextResponse.json({ shelters, airRaid, medical })
}
