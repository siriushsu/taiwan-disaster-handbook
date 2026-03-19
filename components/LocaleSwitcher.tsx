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
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
            locale === l
              ? 'bg-white text-slate-700'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  )
}
