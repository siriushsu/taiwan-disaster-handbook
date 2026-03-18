'use client'
import { useState } from 'react'
import MemberForm from '@/components/form/MemberForm'
import ContactForm from '@/components/form/ContactForm'
import { DISTRICTS } from '@/lib/districts'
import type { HouseholdForm, Member, EmergencyContact, HandbookData } from '@/types'

const defaultMember = (): Member => ({
  name: '', birthYear: '', bloodType: '不知道',
  isMobilityImpaired: false, hasChronic: false,
  medications: '', allergies: '', specialNeeds: '',
  hasDifferentAddress: false, city: '', district: '', address: '',
})

const defaultContact = (): EmergencyContact => ({
  name: '', relation: '', phone: '', phoneBackup: '', isOutOfCity: false,
})

const CITIES = [
  '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '臺東縣', '澎湖縣', '金門縣', '連江縣',
]

export default function Home() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState<HouseholdForm>({
    address: '', city: '臺北市', district: '',
    housingType: 'apartment', floor: '',
    hasPets: false, petInfo: '',
    members: [defaultMember()],
    contacts: [defaultContact()],
  })

  const updateForm = (field: keyof HouseholdForm, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const updateMember = (i: number, m: Member) =>
    setForm(prev => {
      const members = [...prev.members]; members[i] = m; return { ...prev, members }
    })

  const updateContact = (i: number, c: EmergencyContact) =>
    setForm(prev => {
      const contacts = [...prev.contacts]; contacts[i] = c; return { ...prev, contacts }
    })

  // 對單一地址進行 geocode + 查詢附近設施
  const queryLocation = async (address: string, city: string) => {
    let geo = null
    let shelters: unknown[] = []
    let airRaid: unknown[] = []
    let medical: unknown[] = []
    try {
      const geoRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (geoRes.ok) geo = await geoRes.json()
    } catch { /* geocoding 失敗，跳過 */ }

    if (geo?.lat && geo?.lng) {
      try {
        const sRes = await fetch('/api/shelters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: geo.lat, lng: geo.lng, city }),
        })
        if (sRes.ok) {
          const d = await sRes.json()
          shelters = d.shelters ?? []
          airRaid = d.airRaid ?? []
          medical = d.medical ?? []
        }
      } catch { /* 查詢失敗，跳過 */ }
    }
    return { geo, shelters, airRaid, medical }
  }

  const generateHandbook = async () => {
    setLoading(true)
    setError('')
    try {
      // 收集所有需要查詢的地址
      const addressTargets = [
        {
          label: '主住家',
          address: `${form.city}${form.district}${form.address}`,
          city: form.city,
          district: form.district,
          housingType: form.housingType,
          floor: form.floor,
          memberName: undefined as string | undefined,
        },
        ...form.members
          .filter(m => m.name && m.hasDifferentAddress && m.city && m.address)
          .map(m => ({
            label: `${m.name} 的住所`,
            address: `${m.city}${m.district}${m.address}`,
            city: m.city,
            district: m.district,
            housingType: undefined as 'apartment' | 'house' | 'rural' | undefined,
            floor: undefined as number | '' | undefined,
            memberName: m.name,
          })),
      ]

      const locations: import('@/types').LocationInfo[] = []
      for (let i = 0; i < addressTargets.length; i++) {
        const t = addressTargets[i]
        setLoadingMsg(`查詢地址 ${i + 1}/${addressTargets.length}：${t.label}...`)
        const { geo, shelters, airRaid, medical } = await queryLocation(t.address, t.city)
        locations.push({
          label: t.label,
          memberName: t.memberName,
          address: t.address,
          city: t.city,
          district: t.district,
          housingType: t.housingType,
          floor: t.floor,
          geo,
          shelters: shelters as import('@/types').Shelter[],
          airRaid: airRaid as import('@/types').Shelter[],
          medical: medical as import('@/types').MedicalFacility[],
        })
      }

      setLoadingMsg('正在生成手冊...')
      const handbookData: HandbookData = {
        household: form,
        locations,
        generatedAt: new Date().toLocaleDateString('zh-TW'),
      }
      sessionStorage.setItem('handbookData', JSON.stringify(handbookData))
      window.location.href = '/handbook'
    } catch (e) {
      setError(e instanceof Error ? e.message : '發生錯誤，請再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* 頁首 */}
      <div className="bg-blue-600 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">台灣家庭防災手冊產生器</h1>
          <p className="text-blue-200 mt-1 text-sm">
            輸入您的家庭資訊，立即生成個人化防災手冊 PDF
          </p>
        </div>
      </div>

      {/* 步驟指示器 */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {[
            { n: 1, label: '住家資訊' },
            { n: 2, label: '家庭成員' },
            { n: 3, label: '緊急聯絡' },
          ].map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                step === n ? 'bg-blue-500 text-white' :
                step > n ? 'bg-green-100 text-green-700' : 'bg-white text-gray-400'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === n ? 'bg-white text-blue-700' :
                step > n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{n}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Step 1: 住家資訊 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">住家資訊</h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">縣市</label>
              <select
                value={form.city}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value, district: '' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">區/鄉/鎮市</label>
              <select
                value={form.district}
                onChange={e => updateForm('district', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">請選擇</option>
                {(DISTRICTS[form.city] ?? []).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">詳細地址</label>
              <input
                type="text"
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                placeholder="例：信義路四段 1 號"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">住宅類型</label>
                <select
                  value={form.housingType}
                  onChange={e => updateForm('housingType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="apartment">公寓/大樓</option>
                  <option value="house">透天厝</option>
                  <option value="rural">農村/山區</option>
                </select>
              </div>
              {form.housingType === 'apartment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">居住樓層</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={e => updateForm('floor', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="例：8"
                    min={1} max={50}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.hasPets}
                  onChange={e => updateForm('hasPets', e.target.checked)}
                  className="rounded"
                />
                家中有寵物
              </label>
              {form.hasPets && (
                <input
                  type="text"
                  value={form.petInfo}
                  onChange={e => updateForm('petInfo', e.target.value)}
                  placeholder="例：柯基犬 1 隻、貓 2 隻"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.city || !form.address}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-600 transition-colors"
            >
              下一步：家庭成員
            </button>
          </div>
        )}

        {/* Step 2: 家庭成員 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">家庭成員</h2>
            <p className="text-sm text-gray-500">每位成員的資訊將用於客製化物資清單與醫療建議。</p>

            <div className="space-y-3">
              {form.members.map((m, i) => (
                <MemberForm
                  key={i}
                  index={i}
                  member={m}
                  onChange={updateMember}
                  onRemove={i => setForm(prev => ({
                    ...prev,
                    members: prev.members.filter((_, idx) => idx !== i)
                  }))}
                  canRemove={form.members.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, members: [...prev.members, defaultMember()] }))}
              className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-2 rounded-xl hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
            >
              + 新增成員
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!form.members.some(m => m.name)}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-blue-600 transition-colors"
              >
                下一步：緊急聯絡
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 緊急聯絡人 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">緊急聯絡人</h2>
            <p className="text-sm text-gray-500">
              建議至少填寫一位外縣市親友作為「訊息中繼人」，失聯時可透過他確認家人狀況。
            </p>

            <div className="space-y-3">
              {form.contacts.map((c, i) => (
                <ContactForm
                  key={i}
                  index={i}
                  contact={c}
                  onChange={updateContact}
                  onRemove={i => setForm(prev => ({
                    ...prev,
                    contacts: prev.contacts.filter((_, idx) => idx !== i)
                  }))}
                  canRemove={form.contacts.length > 1}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, contacts: [...prev.contacts, defaultContact()] }))}
              className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-2 rounded-xl hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
            >
              + 新增聯絡人
            </button>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                上一步
              </button>
              <button
                onClick={generateHandbook}
                disabled={loading || !form.contacts.some(c => c.name && c.phone)}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-emerald-600 transition-colors"
              >
                {loading ? (loadingMsg || '生成中...') : '生成防災手冊'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
