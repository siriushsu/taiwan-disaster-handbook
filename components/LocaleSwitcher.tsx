'use client'
import { LOCALES, LOCALE_NAMES, type Locale } from '@/lib/i18n'

interface Props {
  locale: Locale
  onChange: (locale: Locale) => void
}

export default function LocaleSwitcher({ locale, onChange }: Props) {
  return (
    <div className="flex gap-1">
      {LOCALES.map(l => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            locale === l
              ? 'bg-white text-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  )
}
