'use client'
import { useEffect, useRef } from 'react'
import type { LocationInfo, Shelter, MedicalFacility } from '@/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function icon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

const HOME_ICON = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface Props { locations: LocationInfo[] }

export default function ShelterMap({ locations }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const loc = locations[0]
    if (!loc?.geo) return

    const map = L.map(ref.current, { zoomControl: true, attributionControl: true })
      .setView([loc.geo.lat, loc.geo.lng], 15)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    const bounds = L.latLngBounds([])

    locations.forEach((loc) => {
      if (!loc.geo) return
      L.marker([loc.geo.lat, loc.geo.lng], { icon: HOME_ICON })
        .addTo(map).bindPopup(`<b>${loc.label}</b><br/>${loc.address}`)
      bounds.extend([loc.geo.lat, loc.geo.lng])

      loc.shelters.forEach((s: Shelter) => {
        if (!s.lat || !s.lng) return
        L.marker([s.lat, s.lng], { icon: icon('#3b82f6') })
          .addTo(map).bindPopup(`<b>${s.name}</b><br/>${s.address || ''}<br/>${s.distance ? Math.round(s.distance) + 'm' : ''}`)
        bounds.extend([s.lat, s.lng])
      })

      ;(loc.airRaid ?? []).slice(0, 3).forEach((s: Shelter) => {
        if (!s.lat || !s.lng) return
        L.marker([s.lat, s.lng], { icon: icon('#8b5cf6') })
          .addTo(map).bindPopup(`<b>防空避難所</b><br/>${s.address || s.name}`)
        bounds.extend([s.lat, s.lng])
      })

      loc.medical.slice(0, 3).forEach((m: MedicalFacility) => {
        if (!m.lat || !m.lng) return
        L.marker([m.lat, m.lng], { icon: icon('#059669') })
          .addTo(map).bindPopup(`<b>${m.name}</b>${m.hasER ? ' (急診)' : ''}<br/>${m.address || ''}`)
        bounds.extend([m.lat, m.lng])
      })
    })

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 })

    return () => { map.remove(); mapRef.current = null }
  }, [locations])

  if (!locations[0]?.geo) return null

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      <div ref={ref} style={{ height: 300 }} />
      <div className="flex gap-4 px-3 py-2 bg-gray-50 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> 住家</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 避難所</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> 防空</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> 醫療</span>
      </div>
    </div>
  )
}
