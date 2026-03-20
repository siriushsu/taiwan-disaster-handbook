'use client'
import { useEffect, useRef, useCallback } from 'react'
import type { LocationInfo, Shelter, MedicalFacility } from '@/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toPng } from 'html-to-image'

function dot(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

const HOME_DOT = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface Props {
  locations: LocationInfo[]
  onAllCaptured: (images: Record<number, string>) => void
}

/** Renders one hidden map per location, captures each as PNG */
export default function MapCapture({ locations, onAllCaptured }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const captured = useRef(false)

  const captureAll = useCallback(async () => {
    if (captured.current || !containerRef.current) return
    captured.current = true

    // Wait for all tiles to load
    await new Promise(r => setTimeout(r, 2500))

    const images: Record<number, string> = {}
    const mapEls = containerRef.current.querySelectorAll<HTMLDivElement>('[data-map-idx]')

    for (const el of mapEls) {
      const idx = parseInt(el.dataset.mapIdx || '0')
      try {
        const dataUrl = await toPng(el, { quality: 0.8, pixelRatio: 1.5 })
        images[idx] = dataUrl
      } catch {
        // skip this one
      }
    }

    if (Object.keys(images).length > 0) {
      try { sessionStorage.setItem('mapImages', JSON.stringify(images)) } catch { /* quota exceeded, skip cache */ }
      onAllCaptured(images)
    }
  }, [onAllCaptured])

  useEffect(() => {
    if (!containerRef.current) return
    const maps: L.Map[] = []
    const lastGeoIdx = locations.reduce((acc, l, i) => l.geo ? i : acc, -1)

    locations.forEach((loc, idx) => {
      if (!loc.geo) return
      const el = containerRef.current!.querySelector<HTMLDivElement>(`[data-map-idx="${idx}"]`)
      if (!el) return

      const map = L.map(el, { zoomControl: false, attributionControl: false })
      maps.push(map)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        crossOrigin: 'anonymous',
      }).addTo(map)

      const bounds = L.latLngBounds([])

      // Home
      L.marker([loc.geo.lat, loc.geo.lng], { icon: HOME_DOT }).addTo(map)
      bounds.extend([loc.geo.lat, loc.geo.lng])

      // Shelters (blue) — only top 3 to keep map focused
      loc.shelters.slice(0, 3).forEach((s: Shelter) => {
        if (!s.lat || !s.lng) return
        L.marker([s.lat, s.lng], { icon: dot('#3b82f6') }).addTo(map)
        bounds.extend([s.lat, s.lng])
      })

      // Air raid (purple) — top 2
      ;(loc.airRaid ?? []).slice(0, 2).forEach((s: Shelter) => {
        if (!s.lat || !s.lng) return
        L.marker([s.lat, s.lng], { icon: dot('#8b5cf6') }).addTo(map)
        bounds.extend([s.lat, s.lng])
      })

      // Medical (green) — top 2
      loc.medical.slice(0, 2).forEach((m: MedicalFacility) => {
        if (!m.lat || !m.lng) return
        L.marker([m.lat, m.lng], { icon: dot('#059669') }).addTo(map)
        bounds.extend([m.lat, m.lng])
      })

      // Fit bounds with generous padding for better framing
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      } else {
        map.setView([loc.geo.lat, loc.geo.lng], 15)
      }

      map.whenReady(() => {
        // After all maps ready, capture
        if (idx === lastGeoIdx) {
          captureAll()
        }
      })
    })

    return () => {
      captured.current = false
      maps.forEach(m => m.remove())
    }
  }, [locations, captureAll])

  // Filter to only locations with geo
  const geoLocations = locations.filter(l => l.geo)
  if (geoLocations.length === 0) return null

  return (
    <div ref={containerRef} style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      {geoLocations.map((loc) => {
        const realIdx = locations.indexOf(loc)
        return (
          <div
            key={realIdx}
            data-map-idx={realIdx}
            style={{ width: 600, height: 300 }}
          />
        )
      })}
    </div>
  )
}
