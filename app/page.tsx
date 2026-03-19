'use client'
import { useState } from 'react'
import MemberForm from '@/components/form/MemberForm'
import ContactForm from '@/components/form/ContactForm'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { DISTRICTS } from '@/lib/districts'
import { DISTRICTS_EN } from '@/lib/districts-en'
import { CITIES } from '@/lib/cities'
import { t, type Locale } from '@/lib/i18n'
import { FOREIGN_RESOURCES } from '@/lib/foreign-resources'
import type { HouseholdForm, Member, EmergencyContact, HandbookData } from '@/types'

const defaultMember = (): Member => ({
  name: '', birthYear: '', bloodType: '不知道',
  isMobilityImpaired: false, hasChronic: false,
  medications: '', allergies: '', specialNeeds: '',
  dailyLocation: '', dailyCity: '', dailyDistrict: '', dailyAddress: '',
  hasDifferentAddress: false, city: '', district: '', address: '',
})

const defaultContact = (): EmergencyContact => ({
  name: '', relation: '', phone: '', phoneBackup: '', isOutOfCity: false,
})

// CITIES imported from @/lib/cities

export default function Home() {
  const [locale, setLocale] = useState<Locale>('zh-TW')
  const T = (key: Parameters<typeof t>[1], vars?: Record<string, string>) => t(locale, key, vars)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [showSupport, setShowSupport] = useState(false)

  const [form, setForm] = useState<HouseholdForm>({
    address: '', city: '臺北市', district: '',
    housingType: 'apartment', floor: '' as string,
    hasPets: false, petInfo: '',
    hasInfant: false, infantInfo: '',
    isForeignNational: false, nationality: '',
    employerName: '', employerPhone: '',
    brokerName: '', brokerPhone: '',
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

  // 對單一地址進行 geocode + 查詢附近設施（純前端，不經過 API）
  const queryLocation = async (address: string, _city: string) => {
    const { geocode, findNearby } = await import('@/lib/client-lookup')
    let geo = null
    let shelters: unknown[] = []
    let airRaid: unknown[] = []
    let medical: unknown[] = []
    try {
      geo = await geocode(address)
    } catch { /* geocoding 失敗，跳過 */ }

    if (geo?.lat && geo?.lng) {
      try {
        const result = await findNearby(geo.lat, geo.lng)
        shelters = result.shelters
        airRaid = result.airRaid
        medical = result.medical
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
            floor: undefined as string | undefined,
            memberName: m.name,
          })),
        ...form.members
          .filter(m => m.name && m.dailyCity && m.dailyAddress)
          .map(m => ({
            label: `${m.name}${m.dailyLocation ? `（${m.dailyLocation}）` : ''} 白天地點`,
            address: `${m.dailyCity}${m.dailyDistrict}${m.dailyAddress}`,
            city: m.dailyCity,
            district: m.dailyDistrict,
            housingType: undefined as 'apartment' | 'house' | 'rural' | undefined,
            floor: undefined as string | undefined,
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
      try {
        sessionStorage.setItem('handbookData', JSON.stringify(handbookData))
      } catch {
        // sessionStorage quota exceeded or not available - try clearing old data
        sessionStorage.clear()
        sessionStorage.setItem('handbookData', JSON.stringify(handbookData))
      }
      window.location.href = '/handbook'
    } catch (e) {
      console.error('Generate error:', e)
      setError(e instanceof Error ? e.message : '發生錯誤，請確認網路連線後再試一次')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50">
      {/* 頁首 */}
      <div className="bg-slate-700 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{T('site_title')}</h1>
            <LocaleSwitcher locale={locale} onChange={setLocale} />
          </div>
          <p className="text-slate-300 mt-1 text-sm">
            {T('site_desc')}
          </p>
          <p className="text-slate-300/80 mt-2 text-xs">
            {T('privacy_notice')}
          </p>
        </div>
      </div>

      {/* 步驟指示器 */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {[
            { n: 1, label: T('step1') },
            { n: 2, label: T('step2') },
            { n: 3, label: T('step3') },
          ].map(({ n, label }) => (
            <div
              key={n}
              className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                step === n ? 'bg-slate-600 text-white' :
                step > n ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-gray-400'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === n ? 'bg-white text-slate-700' :
                step > n ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
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
            <h2 className="text-lg font-bold text-gray-800">{T('step1')}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{T('city')}</label>
              <select
                value={form.city}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value, district: '' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {CITIES.map(([zh, en]) => <option key={zh} value={zh}>{locale === 'en' ? `${en} ${zh}` : zh}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{T('district')}</label>
              <select
                value={form.district}
                onChange={e => updateForm('district', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">{T('select_please')}</option>
                {(DISTRICTS[form.city] ?? []).map(d => (
                  <option key={d} value={d}>{locale === 'en' ? `${DISTRICTS_EN[d] || d} ${d}` : d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{T('address')}</label>
              <input
                type="text"
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                placeholder={T('address_placeholder')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">{T('housing_type')}</label>
                <select
                  value={form.housingType}
                  onChange={e => updateForm('housingType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="apartment">{T('apartment')}</option>
                  <option value="house">{T('house')}</option>
                  <option value="rural">{T('rural')}</option>
                </select>
              </div>
              {form.housingType === 'apartment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{T('floor')}</label>
                  <input
                    type="text"
                    value={form.floor}
                    onChange={e => updateForm('floor', e.target.value)}
                    placeholder="例：8、B1、B2"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
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
                {T('has_pets')}
              </label>
              {form.hasPets && (
                <input
                  type="text"
                  value={form.petInfo}
                  onChange={e => updateForm('petInfo', e.target.value)}
                  placeholder="例：柯基犬 1 隻、貓 2 隻"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.hasInfant}
                  onChange={e => updateForm('hasInfant', e.target.checked)}
                  className="rounded"
                />
                家中有嬰幼兒（3 歲以下）
              </label>
              {form.hasInfant && (
                <input
                  type="text"
                  value={form.infantInfo}
                  onChange={e => updateForm('infantInfo', e.target.value)}
                  placeholder="例：1 歲男嬰、需要特殊配方奶"
                  className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isForeignNational}
                  onChange={e => updateForm('isForeignNational', e.target.checked)}
                  className="rounded"
                />
                外籍人士 / Foreign National
              </label>
              {form.isForeignNational && (
                <div className="mt-3 space-y-3 bg-blue-50 rounded-lg p-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">國籍 Nationality</label>
                    <select
                      value={form.nationality}
                      onChange={e => updateForm('nationality', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="">請選擇 / Select</option>
                      {FOREIGN_RESOURCES.map(r => (
                        <option key={r.nationality} value={r.nationality}>{r.nameZh} {r.nameNative}</option>
                      ))}
                      <option value="OTHER">其他 / Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">雇主姓名 Employer</label>
                      <input type="text" value={form.employerName}
                        onChange={e => updateForm('employerName', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">雇主電話</label>
                      <input type="tel" value={form.employerPhone}
                        onChange={e => updateForm('employerPhone', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">仲介姓名 Broker</label>
                      <input type="text" value={form.brokerName}
                        onChange={e => updateForm('brokerName', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">仲介電話</label>
                      <input type="tel" value={form.brokerPhone}
                        onChange={e => updateForm('brokerPhone', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-300" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.city || !form.address}
              className="w-full bg-slate-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-slate-700 transition-colors"
            >
              {T('next_step_members')}
            </button>
            <button
              onClick={generateHandbook}
              disabled={loading || !form.city || !form.address}
              className="w-full border border-slate-300 text-slate-500 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              {loading ? (loadingMsg || T('generating')) : T('skip_generate')}
            </button>
          </div>
        )}

        {/* Step 2: 家庭成員 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">{T('members_title')}</h2>
            <p className="text-sm text-gray-500">{T('members_desc')}</p>

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
                  locale={locale}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, members: [...prev.members, defaultMember()] }))}
              className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-2 rounded-xl hover:border-slate-400 hover:text-slate-500 transition-colors text-sm"
            >
              + 新增成員
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={false}
                className="flex-1 bg-slate-600 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-slate-700 transition-colors"
              >
                下一步：緊急聯絡
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 緊急聯絡人 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">{T('contacts_title')}</h2>
            <p className="text-sm text-gray-500">{T('contacts_desc')}</p>

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
              className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-2 rounded-xl hover:border-slate-400 hover:text-slate-500 transition-colors text-sm"
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
                disabled={loading}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-semibold disabled:opacity-40 hover:bg-emerald-600 transition-colors"
              >
                {loading ? (loadingMsg || T('generating')) : T('generate')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback & Footer */}
      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 mb-1">
            {locale === 'en' ? 'Help us improve' : '資料有誤？幫助我們改善'}
          </p>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=data-correction.yml"
            target="_blank" rel="noopener noreferrer"
            className="block text-center border border-amber-200 bg-amber-50 text-amber-700 py-2 rounded-lg text-sm hover:bg-amber-100 transition-colors">
            {locale === 'en' ? '📍 Report data error' : '📍 回報資料錯誤'}
          </a>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=feature-request.yml"
            target="_blank" rel="noopener noreferrer"
            className="block text-center border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            {locale === 'en' ? '💡 Feature request' : '💡 功能建議'}
          </a>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook"
            target="_blank" rel="noopener noreferrer"
            className="block text-center text-slate-400 text-xs py-1 hover:underline">
            {locale === 'en' ? '⭐ Open source project — contributions welcome' : '⭐ 開源專案 — 歡迎貢獻'}
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          {!showSupport ? (
            <button onClick={() => setShowSupport(true)}
              className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
              {locale === 'en' ? '☕ Enjoying this? Buy the developer a coffee' : '☕ 覺得有幫助？請開發者喝杯咖啡'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-600 text-center">
                {locale === 'en' ? 'Thank you for your support!' : '感謝你的支持！'}
              </p>
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
      </div>
    </main>
  )
}
