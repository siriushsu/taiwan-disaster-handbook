'use client'
import { useState, useEffect } from 'react'
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
  const [isLineApp, setIsLineApp] = useState(false)

  useEffect(() => {
    if (/Line\//i.test(navigator.userAgent)) setIsLineApp(true)
  }, [])

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
    <main className="min-h-screen bg-surface">
      {/* 頁首 */}
      <div className="bg-primary text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{T('site_title')}</h1>
            <LocaleSwitcher locale={locale} onChange={setLocale} />
          </div>
          <p className="text-white/75 mt-1 text-sm">
            {T('site_desc')}
          </p>
          <p className="text-white/55 mt-2 text-xs">
            {T('privacy_notice')}
          </p>
        </div>
      </div>

      {/* LINE 內建瀏覽器警告 */}
      {isLineApp && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm">
            <p className="font-bold text-warning mb-2">⚠️ 請用外部瀏覽器開啟</p>
            <p className="text-warning/90 text-xs mb-3">
              LINE 內建瀏覽器無法下載 PDF，請依以下步驟操作：
            </p>
            <ol className="text-xs text-text space-y-1.5 mb-3 list-none pl-0">
              <li>1️⃣ 點擊右下角 <span className="font-bold">「⋯」</span> 按鈕</li>
              <li>2️⃣ 選擇 <span className="font-bold">「在預設瀏覽器中開啟」</span></li>
            </ol>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  alert('已複製網址！請打開 Safari 或 Chrome，貼上網址即可使用。')
                })
              }}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              或點此複製網址
            </button>
          </div>
        </div>
      )}

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
                step === n ? 'bg-primary text-white' :
                step > n ? 'bg-primary-light text-primary' : 'bg-white text-text-faint'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === n ? 'bg-white text-primary' :
                step > n ? 'bg-success text-white' : 'bg-surface-muted text-text-faint'
              }`}>{n}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Step 1: 住家資訊 */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-text">{T('step1')}</h2>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{T('city')}</label>
              <select
                value={form.city}
                onChange={e => setForm(prev => ({ ...prev, city: e.target.value, district: '' }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                {CITIES.map(([zh, en]) => <option key={zh} value={zh}>{locale === 'en' ? `${en} ${zh}` : zh}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{T('district')}</label>
              <select
                value={form.district}
                onChange={e => updateForm('district', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <option value="">{T('select_please')}</option>
                {(DISTRICTS[form.city] ?? []).map(d => (
                  <option key={d} value={d}>{locale === 'en' ? `${DISTRICTS_EN[d] || d} ${d}` : d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">{T('address')}</label>
              <input
                type="text"
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                placeholder={T('address_placeholder')}
                className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">{T('housing_type')}</label>
                <select
                  value={form.housingType}
                  onChange={e => updateForm('housingType', e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                  <option value="apartment">{T('apartment')}</option>
                  <option value="house">{T('house')}</option>
                  <option value="rural">{T('rural')}</option>
                </select>
              </div>
              {form.housingType === 'apartment' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{T('floor')}</label>
                  <input
                    type="text"
                    value={form.floor}
                    onChange={e => updateForm('floor', e.target.value)}
                    placeholder="例：8、B1、B2"
                    className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted">
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
                  className="mt-2 w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted">
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
                  className="mt-2 w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input
                  type="checkbox"
                  checked={form.isForeignNational}
                  onChange={e => updateForm('isForeignNational', e.target.checked)}
                  className="rounded"
                />
                外籍人士 / Foreign National
              </label>
              {form.isForeignNational && (
                <div className="mt-3 space-y-3 bg-primary-light rounded-lg p-3">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">國籍 Nationality</label>
                    <select
                      value={form.nationality}
                      onChange={e => updateForm('nationality', e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
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
                      <label className="block text-sm font-medium text-text-muted mb-1">雇主姓名 Employer</label>
                      <input type="text" value={form.employerName}
                        onChange={e => updateForm('employerName', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">雇主電話</label>
                      <input type="tel" value={form.employerPhone}
                        onChange={e => updateForm('employerPhone', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">仲介姓名 Broker</label>
                      <input type="text" value={form.brokerName}
                        onChange={e => updateForm('brokerName', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">仲介電話</label>
                      <input type="tel" value={form.brokerPhone}
                        onChange={e => updateForm('brokerPhone', e.target.value)}
                        placeholder="選填 / Optional"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.city || !form.address}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
            >
              {T('next_step_members')}
            </button>
            <button
              onClick={generateHandbook}
              disabled={loading || !form.city || !form.address}
              className="w-full border border-border text-text-muted py-2 rounded-lg text-sm hover:bg-surface transition-colors disabled:opacity-40"
            >
              {loading ? (loadingMsg || T('generating')) : T('skip_generate')}
            </button>
          </div>
        )}

        {/* Step 2: 家庭成員 */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-text">{T('members_title')}</h2>
            <p className="text-sm text-text-muted">{T('members_desc')}</p>

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
              className="w-full border-2 border-dashed border-border text-text-faint py-2 rounded-lg hover:border-primary hover:text-primary transition-colors text-sm"
            >
              + 新增成員
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-border text-text-muted py-3 rounded-lg font-semibold hover:bg-surface transition-colors">
                上一步
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={false}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
              >
                下一步：緊急聯絡
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 緊急聯絡人 */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-border">
            <h2 className="text-lg font-bold text-text">{T('contacts_title')}</h2>
            <p className="text-sm text-text-muted">{T('contacts_desc')}</p>

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
              className="w-full border-2 border-dashed border-border text-text-faint py-2 rounded-lg hover:border-primary hover:text-primary transition-colors text-sm"
            >
              + 新增聯絡人
            </button>

            {error && (
              <div className="bg-error/10 text-error px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-border text-text-muted py-3 rounded-lg font-semibold hover:bg-surface transition-colors">
                上一步
              </button>
              <button
                onClick={generateHandbook}
                disabled={loading}
                className="flex-1 bg-accent text-white py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-accent-dark transition-colors"
              >
                {loading ? (loadingMsg || T('generating')) : T('generate')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback & Footer */}
      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-text-muted mb-1">
            {locale === 'en' ? 'Help us improve' : '資料有誤？幫助我們改善'}
          </p>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=data-correction.yml"
            target="_blank" rel="noopener noreferrer"
            className="block text-center border border-warning/30 bg-warning/10 text-warning py-2 rounded-lg text-sm hover:bg-warning/15 transition-colors">
            {locale === 'en' ? '📍 Report data error' : '📍 回報資料錯誤'}
          </a>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=feature-request.yml"
            target="_blank" rel="noopener noreferrer"
            className="block text-center border border-border text-text-muted py-2 rounded-lg text-sm hover:bg-surface transition-colors">
            {locale === 'en' ? '💡 Feature request' : '💡 功能建議'}
          </a>
          <a href="https://github.com/siriushsu/taiwan-disaster-handbook"
            target="_blank" rel="noopener noreferrer"
            className="block text-center text-text-faint text-xs py-1 hover:underline">
            {locale === 'en' ? '⭐ Open source project — contributions welcome' : '⭐ 開源專案 — 歡迎貢獻'}
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border p-4">
          {!showSupport ? (
            <button onClick={() => setShowSupport(true)}
              className="w-full text-center text-sm text-accent hover:text-accent-dark font-medium transition-colors">
              {locale === 'en' ? '☕ Enjoying this? Buy the developer a coffee' : '☕ 覺得有幫助？請開發者喝杯咖啡'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text text-center">
                {locale === 'en' ? 'Thank you for your support!' : '感謝你的支持！'}
              </p>
              <a href="https://ko-fi.com/siriushsu" target="_blank" rel="noopener noreferrer"
                className="block text-center bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">
                ☕ Ko-fi（信用卡 / PayPal）
              </a>
              <div className="text-center">
                <p className="text-xs text-text-faint mb-1">或銀行轉帳</p>
                <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                  <span className="text-sm text-text-muted">玉山銀行 (808)</span>
                  <span className="text-sm font-mono font-semibold text-text">0521979118500</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText('0521979118500'); alert('已複製帳號') }}
                    className="text-xs bg-surface-muted hover:bg-border text-text-muted px-2 py-0.5 rounded transition-colors"
                  >複製</button>
                </div>
              </div>
              <p className="text-center text-xs text-text-faint">本專案為開源免費工具，您的支持幫助我們維護伺服器與持續改善內容</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
