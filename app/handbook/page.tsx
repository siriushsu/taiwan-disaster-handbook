'use client'
import { useEffect, useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import HandbookPDF from '@/components/pdf/HandbookPDF'
import type { HandbookData } from '@/types'

export default function HandbookPage() {
  const [data, setData] = useState<HandbookData | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('handbookData')
    if (raw) {
      setData(JSON.parse(raw))
    }
    // 等 client render 完成才顯示 PDFDownloadLink（SSR 不支援）
    setReady(true)
  }, [])

  if (!ready) return null

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">找不到手冊資料</p>
          <a href="/" className="bg-blue-500 text-white px-6 py-2 rounded-xl">返回填寫</a>
        </div>
      </main>
    )
  }

  const memberName = data.household.members[0]?.name ?? '我的家庭'
  const fileName = `防災手冊_${memberName}_${data.generatedAt.replace(/\//g, '-')}.pdf`
  const pageCount = 3 + data.locations.length + 5  // cover + action + reunion + locations + cards + health + supply + earthquake + airraid-fire + typhoon + reminders

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="bg-blue-600 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">您的防災手冊已準備好</h1>
          <p className="text-blue-200 mt-1 text-sm">請下載並列印，放置於家中顯眼位置</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">{memberName} 家庭防災手冊</h2>
          <p className="text-sm text-gray-500 mb-6">製作日期：{data.generatedAt} · 共 {pageCount} 頁</p>
          <PDFDownloadLink
            document={<HandbookPDF data={data} />}
            fileName={fileName}
            className="inline-block bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors text-base"
          >
            {({ loading }) => loading ? '準備 PDF 中（首次需載入字型）...' : '下載 PDF 手冊'}
          </PDFDownloadLink>
          <p className="text-xs text-gray-400 mt-3">您的資料不會上傳到伺服器，PDF 在您的瀏覽器本機生成。</p>
        </div>

        {/* 手冊內容摘要 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-700">手冊包含的地址</h3>
          {data.locations.map((loc, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{i + 1}</span>
                <span className="font-semibold text-gray-700">{loc.label}</span>
              </div>
              <div className="text-sm text-gray-500 mb-2">{loc.address}</div>
              {loc.shelters.length > 0 ? (
                <div className="space-y-1">
                  {loc.shelters.slice(0, 3).map((s, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-blue-400 font-bold">{j + 1}</span>
                      <span>{s.name}</span>
                      {s.distance && (
                        <span className="ml-auto text-green-600 whitespace-nowrap">
                          {s.distance < 1000 ? `${s.distance}m` : `${(s.distance/1000).toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                  未找到避難所資料，請向里辦公室確認
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-orange-50 rounded-2xl p-4 text-sm text-orange-700">
          <strong>建議每年更新一次手冊</strong>，特別是聯絡電話、用藥、或搬家後請重新產生。
        </div>
        <a href="/" className="block text-center text-blue-600 text-sm py-2 hover:underline">重新填寫</a>
      </div>
    </main>
  )
}
