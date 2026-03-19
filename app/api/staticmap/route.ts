import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy to staticmap.openstreetmap.de to avoid CORS issues in react-pdf Image.
 * Usage: /api/staticmap?center=lat,lng&zoom=15&size=600x300&m=lat,lng,ol-marker-red&m=...
 *
 * NOTE: We build the upstream URL manually (not via URLSearchParams) so that
 * commas in center/marker coordinates are NOT percent-encoded — the upstream
 * server requires literal commas in "lat,lng,icon" strings.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const center = searchParams.get('center') ?? ''
  const zoom = searchParams.get('zoom') ?? '15'
  const size = searchParams.get('size') ?? '600x300'
  const markers = searchParams.getAll('m')

  if (!center) {
    return new NextResponse('Missing center', { status: 400 })
  }

  // Build URL manually — do NOT use URLSearchParams here because it
  // percent-encodes commas, breaking the upstream "lat,lng,icon" format.
  const markerParts = markers.map(m => `markers=${m}`).join('&')
  const base = `https://staticmap.openstreetmap.de/staticmap.php?center=${center}&zoom=${zoom}&size=${size}`
  const url = markerParts ? `${base}&${markerParts}` : base

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TaiwanDisasterHandbook/1.0 (https://disaster-handbook.vercel.app)',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      return new NextResponse('Upstream error', { status: 502 })
    }

    const buf = await res.arrayBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('Map unavailable', { status: 502 })
  }
}
