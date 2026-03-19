'use client'
import type { EmergencyContact } from '@/types'

interface Props {
  index: number
  contact: EmergencyContact
  onChange: (index: number, updated: EmergencyContact) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export default function ContactForm({ index, contact, onChange, onRemove, canRemove }: Props) {
  const update = (field: keyof EmergencyContact, value: unknown) =>
    onChange(index, { ...contact, [field]: value })

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-700">聯絡人 {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            移除
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
          <input
            type="text"
            value={contact.name}
            onChange={e => update('name', e.target.value)}
            placeholder="例：王大明"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">關係</label>
          <input
            type="text"
            value={contact.relation}
            onChange={e => update('relation', e.target.value)}
            placeholder="例：父親、鄰居"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">主要電話</label>
          <input
            type="tel"
            value={contact.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="0912-345-678"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">備用電話</label>
          <input
            type="tel"
            value={contact.phoneBackup}
            onChange={e => update('phoneBackup', e.target.value)}
            placeholder="02-1234-5678"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={contact.isOutOfCity}
          onChange={e => update('isOutOfCity', e.target.checked)}
          className="rounded"
        />
        外縣市聯絡人（災難時作為家人訊息中繼）
      </label>
    </div>
  )
}
