'use client'
import type { Member } from '@/types'
import { DISTRICTS } from '@/lib/districts'

const CITIES = [
  '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
  '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
  '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
  '臺東縣', '澎湖縣', '金門縣', '連江縣',
]

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"

interface Props {
  index: number
  member: Member
  onChange: (index: number, updated: Member) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export default function MemberForm({ index, member, onChange, onRemove, canRemove }: Props) {
  const update = (field: keyof Member, value: unknown) =>
    onChange(index, { ...member, [field]: value })

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">成員 {index + 1}</h3>
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 text-sm">
            移除
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
          <input type="text" value={member.name} onChange={e => update('name', e.target.value)}
            placeholder="例：王小明" className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">出生年</label>
          <input type="number" value={member.birthYear}
            onChange={e => update('birthYear', e.target.value ? parseInt(e.target.value) : '')}
            placeholder="例：1985" min={1920} max={2026} className={INPUT} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">血型</label>
        <select value={member.bloodType} onChange={e => update('bloodType', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400">
          {['A', 'B', 'AB', 'O', '不知道'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={member.isMobilityImpaired}
            onChange={e => update('isMobilityImpaired', e.target.checked)} className="rounded" />
          行動不便/輪椅
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={member.hasChronic}
            onChange={e => update('hasChronic', e.target.checked)} className="rounded" />
          有慢性病
        </label>
      </div>

      {member.hasChronic && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">長期用藥（藥名）</label>
          <input type="text" value={member.medications}
            onChange={e => update('medications', e.target.value)}
            placeholder="例：降血壓藥、胰島素" className={INPUT} />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">過敏資訊（選填）</label>
        <input type="text" value={member.allergies}
          onChange={e => update('allergies', e.target.value)}
          placeholder="例：青黴素過敏、花生過敏" className={INPUT} />
      </div>

      {/* 不同住址 */}
      <div className="border-t border-gray-200 pt-3">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={member.hasDifferentAddress}
            onChange={e => update('hasDifferentAddress', e.target.checked)} className="rounded" />
          此成員住址與主住家不同
        </label>

        {member.hasDifferentAddress && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">縣市</label>
                <select value={member.city}
                  onChange={e => onChange(index, { ...member, city: e.target.value, district: '' })}
                  className={INPUT}>
                  <option value="">請選擇</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">區/鄉/鎮市</label>
                <select value={member.district} onChange={e => update('district', e.target.value)}
                  className={INPUT}>
                  <option value="">請選擇</option>
                  {(DISTRICTS[member.city] ?? []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">詳細地址</label>
              <input type="text" value={member.address} onChange={e => update('address', e.target.value)}
                placeholder="例：中山路一段 100 號" className={INPUT} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
