'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Shelter, MedicalFacility, AedLocation, FireStation, PoliceStation } from '@/types'

function icon(color: string, size = 12) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const CLICK_ICON = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

interface NearbyResult {
  shelters: Shelter[]
  airRaid: Shelter[]
  medical: MedicalFacility[]
  aed: AedLocation[]
  fireStation: FireStation[]
  policeStation: PoliceStation[]
}

interface Props {
  onBack: () => void
  onUseLocation: (lat: number, lng: number) => void
  locale: string
}

export default function InteractiveMap({ onBack, onUseLocation, locale }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const clickMarkerRef = useRef<L.Marker | null>(null)
  const [result, setResult] = useState<NearbyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [clickedLat, setClickedLat] = useState(0)
  const [clickedLng, setClickedLng] = useState(0)
  const zh = locale !== 'en'

  const handleMapClick = useCallback(async (lat: number, lng: number, map: L.Map) => {
    setLoading(true)
    setClickedLat(lat)
    setClickedLng(lng)

    // Place click marker
    if (clickMarkerRef.current) clickMarkerRef.current.remove()
    clickMarkerRef.current = L.marker([lat, lng], { icon: CLICK_ICON }).addTo(map)

    // Find nearby facilities
    const { findNearby } = await import('@/lib/client-lookup')
    const res = await findNearby(lat, lng)
    setResult(res)

    // Clear old markers, add new ones
    if (markersRef.current) markersRef.current.clearLayers()
    const group = L.layerGroup().addTo(map)
    markersRef.current = group

    const bounds = L.latLngBounds([[lat, lng]])

    res.shelters.slice(0, 3).forEach(s => {
      if (!s.lat || !s.lng) return
      L.marker([s.lat, s.lng], { icon: icon('#3b82f6') })
        .bindPopup(`<b>${s.name}</b><br/>${s.address || ''}<br/>${s.distance ? Math.round(s.distance) + 'm' : ''}`)
        .addTo(group)
      bounds.extend([s.lat, s.lng])
    })

    res.airRaid.slice(0, 2).forEach(s => {
      if (!s.lat || !s.lng) return
      L.marker([s.lat, s.lng], { icon: icon('#8b5cf6') })
        .bindPopup(`<b>${s.name}</b><br/>${s.address || ''}`)
        .addTo(group)
      bounds.extend([s.lat, s.lng])
    })

    res.medical.slice(0, 2).forEach(m => {
      if (!m.lat || !m.lng) return
      L.marker([m.lat, m.lng], { icon: icon('#059669') })
        .bindPopup(`<b>${m.name}</b><br/>${m.address || ''}`)
        .addTo(group)
      bounds.extend([m.lat, m.lng])
    })

    res.aed.slice(0, 1).forEach(a => {
      if (!a.lat || !a.lng) return
      L.marker([a.lat, a.lng], { icon: icon('#f59e0b') })
        .bindPopup(`<b>AED</b><br/>${a.name}`)
        .addTo(group)
      bounds.extend([a.lat, a.lng])
    })

    res.fireStation?.slice(0, 1).forEach(f => {
      if (!f.lat || !f.lng) return
      L.marker([f.lat, f.lng], { icon: icon('#dc2626') })
        .bindPopup(`<b>${f.name}</b><br/>${f.phone || ''}`)
        .addTo(group)
      bounds.extend([f.lat, f.lng])
    })

    res.policeStation?.slice(0, 1).forEach(p => {
      if (!p.lat || !p.lng) return
      L.marker([p.lat, p.lng], { icon: icon('#2563eb') })
        .bindPopup(`<b>${p.name}</b><br/>${p.phone || ''}`)
        .addTo(group)
      bounds.extend([p.lat, p.lng])
    })

    if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!ref.current || mapRef.current) return

    // Default center: Taiwan
    const map = L.map(ref.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([23.7, 120.9], 8)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 15)
        },
        () => { /* denied or failed, stay at Taiwan view */ },
        { timeout: 5000 }
      )
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      handleMapClick(e.latlng.lat, e.latlng.lng, map)
    })

    return () => { map.remove(); mapRef.current = null }
  }, [handleMapClick])

  const fmt = (d?: number) => {
    if (!d) return ''
    return d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${Math.round(d)}m`
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="text-sm font-medium">
          ← {zh ? '返回' : 'Back'}
        </button>
        <span className="font-bold text-sm">
          {zh ? '點擊地圖查看附近設施' : 'Tap map to find nearby'}
        </span>
        <div className="w-10" />
      </div>

      {/* Legend */}
      <div className="flex gap-3 px-3 py-1.5 bg-surface text-[10px] text-text-muted border-b border-border shrink-0 overflow-x-auto">
        <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {zh ? '點選' : 'Selected'}</span>
        <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> {zh ? '避難所' : 'Shelter'}</span>
        <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> {zh ? '防空' : 'Air Raid'}</span>
        <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> {zh ? '醫療' : 'Medical'}</span>
        <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> AED</span>
      </div>

      {/* Map */}
      <div ref={ref} className="flex-1" />

      {/* Loading */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 rounded-xl px-6 py-3 shadow-lg z-[1000]">
          <p className="text-sm text-text-muted">{zh ? '搜尋中...' : 'Searching...'}</p>
        </div>
      )}

      {/* Results bottom sheet */}
      {result && !loading && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1000] max-h-[55vh] overflow-y-auto border-t border-border">
          <div className="sticky top-0 bg-white px-4 pt-3 pb-1 border-b border-border/50">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-2" />
            <h3 className="font-bold text-sm text-text">
              {zh ? '附近避難設施' : 'Nearby Facilities'}
            </h3>
          </div>

          <div className="px-4 py-3 space-y-2.5">
            {result.shelters[0] && (
              <div className="flex items-start gap-2">
                <span className="w-1 self-stretch rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-faint">{zh ? '避難收容所' : 'Shelter'}</p>
                  <p className="text-sm font-semibold text-text truncate">{result.shelters[0].name}</p>
                  <p className="text-[11px] text-text-muted truncate">{result.shelters[0].address}</p>
                </div>
                <span className="text-xs font-medium text-primary shrink-0">{fmt(result.shelters[0].distance)}</span>
              </div>
            )}

            {result.airRaid[0] && (
              <div className="flex items-start gap-2">
                <span className="w-1 self-stretch rounded-full bg-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-faint">{zh ? '防空避難' : 'Air Raid Shelter'}</p>
                  <p className="text-sm font-semibold text-text truncate">{result.airRaid[0].name}</p>
                  <p className="text-[11px] text-text-muted truncate">{result.airRaid[0].address}</p>
                </div>
                <span className="text-xs font-medium text-warning shrink-0">{fmt(result.airRaid[0].distance)}</span>
              </div>
            )}

            {result.medical[0] && (
              <div className="flex items-start gap-2">
                <span className="w-1 self-stretch rounded-full bg-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-faint">{zh ? '醫療院所' : 'Medical'}</p>
                  <p className="text-sm font-semibold text-text truncate">{result.medical[0].name}</p>
                  <p className="text-[11px] text-text-muted truncate">{result.medical[0].address}</p>
                </div>
                <span className="text-xs font-medium text-success shrink-0">{fmt(result.medical[0].distance)}</span>
              </div>
            )}

            {result.aed[0] && (
              <div className="flex items-start gap-2">
                <span className="w-1 self-stretch rounded-full bg-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-faint">AED</p>
                  <p className="text-sm font-semibold text-text truncate">{(result.aed[0] as AedLocation).name}</p>
                </div>
                <span className="text-xs font-medium text-accent shrink-0">{fmt(result.aed[0].distance)}</span>
              </div>
            )}

            {result.fireStation?.[0] && (
              <div className="flex items-start gap-2">
                <span className="w-1 self-stretch rounded-full bg-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-faint">{zh ? '消防隊' : 'Fire Station'}</p>
                  <p className="text-sm font-semibold text-text truncate">{result.fireStation[0].name}</p>
                  <p className="text-[11px] text-text-muted">{result.fireStation[0].phone}</p>
                </div>
                <span className="text-xs font-medium text-red-500 shrink-0">{fmt(result.fireStation[0].distance)}</span>
              </div>
            )}

            {result.policeStation?.[0] && (
              <div className="flex items-start gap-2">
                <span className="w-1 self-stretch rounded-full bg-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-faint">{zh ? '派出所' : 'Police'}</p>
                  <p className="text-sm font-semibold text-text truncate">{result.policeStation[0].name}</p>
                  <p className="text-[11px] text-text-muted">{result.policeStation[0].phone}</p>
                </div>
                <span className="text-xs font-medium text-blue-600 shrink-0">{fmt(result.policeStation[0].distance)}</span>
              </div>
            )}
          </div>

          <div className="px-4 pb-4 pt-1 space-y-2">
            <button
              onClick={() => onUseLocation(clickedLat, clickedLng)}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm"
            >
              {zh ? '用這個位置製作完整手冊' : 'Create handbook for this location'}
            </button>
            <button
              onClick={() => { setResult(null); if (markersRef.current) markersRef.current.clearLayers(); if (clickMarkerRef.current) clickMarkerRef.current.remove() }}
              className="w-full text-text-muted text-xs py-1"
            >
              {zh ? '點擊地圖其他位置重新搜尋' : 'Tap elsewhere to search again'}
            </button>
          </div>
        </div>
      )}

      {/* Hint when no results */}
      {!result && !loading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-xl px-5 py-2.5 shadow-lg z-[1000]">
          <p className="text-sm text-text-muted text-center">
            {zh ? '👆 點擊地圖任意位置查看附近避難設施' : '👆 Tap anywhere on the map'}
          </p>
        </div>
      )}
    </div>
  )
}
