'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { QRCodeSVG } from 'qrcode.react'
import HandbookPDF from '@/components/pdf/HandbookPDF'
import type { HandbookData, Shelter, MedicalFacility } from '@/types'
import type { BiMode } from '@/lib/pdf-i18n'
import { CITY_DISASTER_LINKS, GENERAL_DISASTER_LINKS } from '@/lib/city-resources'

const ShelterMap = dynamic(() => import('@/components/ShelterMap'), { ssr: false })
const MapCapture = dynamic(() => import('@/components/MapCapture'), { ssr: false })

export default function HandbookPage() {
  const [data, setData] = useState<HandbookData | null>(null)
  const [ready, setReady] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [mapImages, setMapImages] = useState<Record<number, string>>({})
  const [biMode, setBiMode] = useState<BiMode>('zh')
  const [isLineApp, setIsLineApp] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('handbookData')
    if (raw) setData(JSON.parse(raw))
    const imgs = sessionStorage.getItem('mapImages')
    if (imgs) {
      try { setMapImages(JSON.parse(imgs)) } catch {}
    }
    // Detect LINE in-app browser
    if (/Line\//i.test(navigator.userAgent)) setIsLineApp(true)
    setReady(true)
  }, [])

  if (!ready) return null

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">找不到手冊資料</p>
          <a href="/" className="bg-slate-600 text-white px-6 py-2 rounded-xl">返回填寫</a>
        </div>
      </main>
    )
  }

  const updateShelter = (locIdx: number, shelterIdx: number, field: keyof Shelter, value: string) => {
    setData(prev => {
      if (!prev) return prev
      const locs = [...prev.locations]
      const shelters = [...locs[locIdx].shelters]
      shelters[shelterIdx] = { ...shelters[shelterIdx], [field]: value }
      locs[locIdx] = { ...locs[locIdx], shelters }
      const updated = { ...prev, locations: locs }
      sessionStorage.setItem('handbookData', JSON.stringify(updated))
      return updated
    })
  }

  const updateAirRaid = (locIdx: number, shelterIdx: number, field: keyof Shelter, value: string) => {
    setData(prev => {
      if (!prev) return prev
      const locs = [...prev.locations]
      const airRaid = [...(locs[locIdx].airRaid ?? [])]
      airRaid[shelterIdx] = { ...airRaid[shelterIdx], [field]: value }
      locs[locIdx] = { ...locs[locIdx], airRaid }
      const updated = { ...prev, locations: locs }
      sessionStorage.setItem('handbookData', JSON.stringify(updated))
      return updated
    })
  }

  const updateMedical = (locIdx: number, medIdx: number, field: keyof MedicalFacility, value: string) => {
    setData(prev => {
      if (!prev) return prev
      const locs = [...prev.locations]
      const medical = [...locs[locIdx].medical]
      medical[medIdx] = { ...medical[medIdx], [field]: value }
      locs[locIdx] = { ...locs[locIdx], medical }
      const updated = { ...prev, locations: locs }
      sessionStorage.setItem('handbookData', JSON.stringify(updated))
      return updated
    })
  }

  // Recalculate distance after editing a shelter address
  const recalcShelterDistance = async (locIdx: number, shelterIdx: number, type: 'shelters' | 'airRaid' | 'medical') => {
    if (!data) return
    const loc = data.locations[locIdx]
    const list = type === 'airRaid' ? (loc.airRaid ?? []) : type === 'medical' ? loc.medical : loc.shelters
    const item = list[shelterIdx]
    if (!item || !loc.geo) return

    // Try geocoding the shelter's address to get new coordinates
    const { geocode } = await import('@/lib/client-lookup')
    const geo = await geocode(item.address || item.name)
    if (geo) {
      const R = 6371000
      const dLat = ((geo.lat - loc.geo.lat) * Math.PI) / 180
      const dLng = ((geo.lng - loc.geo.lng) * Math.PI) / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((loc.geo.lat * Math.PI) / 180) * Math.cos((geo.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
      const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))

      setData(prev => {
        if (!prev) return prev
        const locs = [...prev.locations]
        const arr = [...(type === 'airRaid' ? (locs[locIdx].airRaid ?? []) : type === 'medical' ? locs[locIdx].medical : locs[locIdx].shelters)]
        arr[shelterIdx] = { ...arr[shelterIdx], lat: geo.lat, lng: geo.lng, distance: dist }
        locs[locIdx] = { ...locs[locIdx], [type]: arr }
        const updated = { ...prev, locations: locs }
        sessionStorage.setItem('handbookData', JSON.stringify(updated))
        return updated
      })
      alert(`已更新座標與距離：${dist} 公尺`)
    } else {
      alert('找不到此地址的座標，請確認地址正確')
    }
  }

  const memberName = data.household.members[0]?.name || '我的家庭'
  const fileName = `防災手冊_${memberName}_${data.generatedAt.replace(/\//g, '-')}.pdf`
  const pageCount = 3 + data.locations.length + 5

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50">
      <div className="bg-slate-700 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">您的防災手冊已準備好</h1>
          <p className="text-slate-300 mt-1 text-sm">下載前可修改避難所資訊，確保內容正確</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {/* Download Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{memberName} 家庭防災手冊</h2>
          <p className="text-sm text-gray-500 mb-6">製作日期：{data.generatedAt} · 共 {pageCount} 頁</p>
          <div className="flex gap-2 justify-center mb-4">
            {([['zh', '中文版'], ['bi', '中英雙語'], ['en', 'English']] as const).map(([mode, label]) => (
              <button key={mode} onClick={() => setBiMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${biMode === mode ? 'bg-slate-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
          {isLineApp ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                LINE 內建瀏覽器無法下載 PDF。請點擊下方按鈕用外部瀏覽器開啟。
                <br />
                <span className="text-xs text-amber-600">LINE browser cannot download PDFs. Please open in external browser.</span>
              </div>
              <button
                onClick={() => {
                  const url = window.location.href
                  window.open(url, '_blank')
                }}
                className="inline-block bg-slate-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors text-base"
              >
                用外部瀏覽器開啟
              </button>
            </div>
          ) : (
            <PDFDownloadLink
              key={`${biMode}-${Object.keys(mapImages).length}`}
              document={<HandbookPDF data={data} mapImages={mapImages} biMode={biMode} />}
              fileName={fileName}
              className="inline-block bg-slate-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors text-base"
            >
              {({ loading }) => loading ? '準備 PDF 中（首次需載入字型）...' : '下載 PDF 手冊'}
            </PDFDownloadLink>
          )}
          <p className="text-xs text-gray-400 mt-3">所有資料僅在瀏覽器本機處理，不會上傳。</p>

          {/* QR Code */}
          <div className="mt-5 flex flex-col items-center">
            <QRCodeSVG
              value={`https://disaster-handbook.vercel.app/?city=${encodeURIComponent(data.household.city)}&district=${encodeURIComponent(data.household.district)}`}
              size={120}
              level="M"
              className="rounded"
            />
            <p className="text-xs text-gray-400 mt-2">掃描 QR Code 分享給家人，讓他們也能快速產生自己的手冊</p>
          </div>

          {/* LINE Share */}
          {data.locations[0]?.shelters[0] && (
            <div className="mt-4 flex gap-2 justify-center">
              <a
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'https://disaster-handbook.vercel.app')}&text=${encodeURIComponent(`我剛做好防災手冊！我家最近的避難所是「${data.locations[0].shelters[0].name}」（${data.locations[0].shelters[0].distance ? Math.round(data.locations[0].shelters[0].distance) + 'm' : ''}）。你也可以做一份：`)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#06C755] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#05b34d] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 5.97 2 10.74c0 3.42 2.47 6.38 6.05 7.47l-.61 2.27c-.08.3.26.53.52.36l2.89-1.93c.37.04.75.06 1.15.06 5.52 0 10-3.97 10-8.23C22 5.97 17.52 2 12 2z"/></svg>
                分享到 LINE
              </a>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: '家庭防災手冊', text: `我剛做好防災手冊！`, url: window.location.origin })
                  } else {
                    navigator.clipboard.writeText(window.location.origin)
                    alert('已複製連結！')
                  }
                }}
                className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                複製連結
              </button>
            </div>
          )}
        </div>

        {/* Map */}
        {data.locations[0]?.geo && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-gray-700 mb-3">附近避難設施地圖</h3>
            <ShelterMap locations={data.locations} />
            <MapCapture locations={data.locations} onAllCaptured={setMapImages} />
          </div>
        )}

        {/* Editable locations */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-700">避難所資訊（可修改）</h3>
            <span className="text-xs text-gray-400">點擊名稱或地址即可編輯</span>
          </div>

          {data.locations.map((loc, locIdx) => (
            <div key={locIdx} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-slate-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{locIdx + 1}</span>
                <span className="font-semibold text-gray-700">{loc.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{loc.address}</span>
              </div>

              {/* Disaster shelters */}
              {loc.shelters.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">避難收容所</p>
                  {loc.shelters.map((sh, si) => (
                    <div key={si} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0 group">
                      <span className="text-slate-400 text-xs font-bold mt-1 w-4 flex-shrink-0">{si + 1}</span>
                      <div className="flex-1 min-w-0">
                        {editing === `s-${locIdx}-${si}-name` ? (
                          <input
                            autoFocus
                            value={sh.name}
                            onChange={e => updateShelter(locIdx, si, 'name', e.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                            className="w-full text-sm border border-slate-300 rounded px-2 py-0.5 text-gray-800"
                          />
                        ) : (
                          <button onClick={() => setEditing(`s-${locIdx}-${si}-name`)}
                            className="text-sm text-gray-800 hover:text-slate-600 text-left w-full truncate">
                            {sh.name}
                          </button>
                        )}
                        {editing === `s-${locIdx}-${si}-addr` ? (
                          <input
                            autoFocus
                            value={sh.address || ''}
                            onChange={e => updateShelter(locIdx, si, 'address', e.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-0.5 text-gray-500 mt-0.5"
                          />
                        ) : (
                          <button onClick={() => setEditing(`s-${locIdx}-${si}-addr`)}
                            className="text-xs text-gray-400 hover:text-slate-500 text-left w-full truncate">
                            {sh.address || '點擊編輯地址'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {sh.distance && (
                          <span className="text-xs text-emerald-600 whitespace-nowrap">
                            {sh.distance < 1000 ? `${sh.distance}m` : `${(sh.distance/1000).toFixed(1)}km`}
                          </span>
                        )}
                        <button onClick={() => recalcShelterDistance(locIdx, si, 'shelters')}
                          className="text-xs bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 px-1.5 py-0.5 rounded transition-colors">↻ 更新</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Air raid shelters */}
              {(loc.airRaid ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-purple-500 mb-1">防空避難所</p>
                  {(loc.airRaid ?? []).slice(0, 3).map((sh, si) => (
                    <div key={si} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-purple-400 text-xs font-bold mt-1 w-4 flex-shrink-0">{si + 1}</span>
                      <div className="flex-1 min-w-0">
                        {editing === `a-${locIdx}-${si}-name` ? (
                          <input autoFocus value={sh.name}
                            onChange={e => updateAirRaid(locIdx, si, 'name', e.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                            className="w-full text-sm border border-slate-300 rounded px-2 py-0.5 text-gray-800" />
                        ) : (
                          <button onClick={() => setEditing(`a-${locIdx}-${si}-name`)}
                            className="text-sm text-gray-800 hover:text-slate-600 text-left w-full truncate">
                            {sh.name}
                          </button>
                        )}
                        {editing === `a-${locIdx}-${si}-addr` ? (
                          <input autoFocus value={sh.address || ''}
                            onChange={e => updateAirRaid(locIdx, si, 'address', e.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                            className="w-full text-xs border border-slate-300 rounded px-2 py-0.5 text-gray-500 mt-0.5" />
                        ) : (
                          <button onClick={() => setEditing(`a-${locIdx}-${si}-addr`)}
                            className="text-xs text-gray-400 hover:text-slate-500 text-left w-full truncate">
                            {sh.address || '點擊編輯地址'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {sh.distance && (
                          <span className="text-xs text-emerald-600 whitespace-nowrap">
                            {sh.distance < 1000 ? `${sh.distance}m` : `${(sh.distance/1000).toFixed(1)}km`}
                          </span>
                        )}
                        <button onClick={() => recalcShelterDistance(locIdx, si, 'airRaid')}
                          className="text-xs bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 px-1.5 py-0.5 rounded transition-colors">↻ 更新</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Medical */}
              {loc.medical.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-500 mb-1">醫療院所</p>
                  {loc.medical.slice(0, 3).map((m, mi) => (
                    <div key={mi} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-emerald-400 text-xs font-bold mt-1 w-4 flex-shrink-0">{mi + 1}</span>
                      <div className="flex-1 min-w-0">
                        {editing === `m-${locIdx}-${mi}-name` ? (
                          <input autoFocus value={m.name}
                            onChange={e => updateMedical(locIdx, mi, 'name', e.target.value)}
                            onBlur={() => setEditing(null)}
                            onKeyDown={e => e.key === 'Enter' && setEditing(null)}
                            className="w-full text-sm border border-slate-300 rounded px-2 py-0.5 text-gray-800" />
                        ) : (
                          <button onClick={() => setEditing(`m-${locIdx}-${mi}-name`)}
                            className="text-sm text-gray-800 hover:text-slate-600 text-left w-full truncate">
                            {m.name}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {m.distance && (
                          <span className="text-xs text-emerald-600 whitespace-nowrap">
                            {m.distance < 1000 ? `${m.distance}m` : `${(m.distance/1000).toFixed(1)}km`}
                          </span>
                        )}
                        <button onClick={() => recalcShelterDistance(locIdx, mi, 'medical')}
                          className="text-xs bg-blue-50 text-blue-500 hover:bg-blue-100 hover:text-blue-700 px-1.5 py-0.5 rounded transition-colors">↻ 更新</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loc.shelters.length === 0 && (loc.airRaid ?? []).length === 0 && (
                <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                  未找到避難所資料，請向里辦公室確認
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 text-sm text-amber-700">
          <strong>建議每年更新一次手冊</strong>，特別是聯絡電話、用藥、或搬家後請重新產生。
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <h3 className="font-bold text-gray-700">政府防災資源</h3>

          {/* City-specific links */}
          {data.household.city && CITY_DISASTER_LINKS[data.household.city] && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1">{data.household.city} 專屬</p>
              {CITY_DISASTER_LINKS[data.household.city].map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="block border border-slate-200 text-slate-600 py-2 px-3 rounded-lg text-sm hover:bg-slate-50 transition-colors mb-1.5">
                  {link.name} →
                </a>
              ))}
            </div>
          )}

          {/* General resources */}
          <p className="text-xs font-semibold text-slate-500 mb-1">全國防災資源</p>
          {GENERAL_DISASTER_LINKS.map((link, i) => (
            <div key={i} className="flex gap-2">
              {'urlZh' in link ? (<>
                <a href={link.urlZh} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  {link.name}
                </a>
                <a href={link.urlEn} target="_blank" rel="noopener noreferrer"
                  className="text-center border border-slate-200 text-slate-600 py-2 px-3 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  EN
                </a>
              </>) : (
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  {link.name}
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Feedback & contribute */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 mb-1">資料有誤？幫助我們改善</p>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=data-correction.yml"
            target="_blank" rel="noopener noreferrer"
            className="block text-center border border-amber-200 bg-amber-50 text-amber-700 py-2 rounded-lg text-sm hover:bg-amber-100 transition-colors">
            📍 回報避難所 / 醫療資料錯誤
          </a>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=feature-request.yml"
            target="_blank" rel="noopener noreferrer"
            className="block text-center border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            💡 功能建議
          </a>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook"
            target="_blank" rel="noopener noreferrer"
            className="block text-center text-slate-400 text-xs py-1 hover:underline">
            ⭐ 開源專案 — 歡迎貢獻
          </a>
        </div>

        {/* Support - collapsed by default */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          {!showSupport ? (
            <button onClick={() => setShowSupport(true)}
              className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
              ☕ 覺得有幫助？請開發者喝杯咖啡
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600 text-center">感謝你的支持！</p>
              <a href="https://ko-fi.com/siriushsu" target="_blank" rel="noopener noreferrer"
                className="block text-center bg-amber-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                ☕ Ko-fi（信用卡 / PayPal）
              </a>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">或銀行轉帳</p>
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-600">玉山銀行 (808)</span>
                  <span className="text-sm font-mono font-semibold text-slate-800">0521979118500</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText('0521979118500'); alert('已複製帳號') }}
                    className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-0.5 rounded transition-colors"
                  >複製</button>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400">本專案為開源免費工具，您的支持幫助我們維護伺服器與持續改善內容</p>
            </div>
          )}
        </div>

        <a href="/" className="block text-center text-slate-500 text-sm py-2 hover:underline">重新填寫</a>
      </div>
    </main>
  )
}
