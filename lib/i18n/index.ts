import zhTW from './zh-TW.json'
import en from './en.json'

export type Locale = 'zh-TW' | 'en'
export type TranslationKey = keyof typeof zhTW

const translations: Record<Locale, Record<string, string>> = { 'zh-TW': zhTW, en }

export function t(locale: Locale, key: TranslationKey, vars?: Record<string, string>): string {
  let text = translations[locale]?.[key] ?? translations['zh-TW'][key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v)
    }
  }
  return text
}

export const LOCALE_NAMES: Record<Locale, string> = {
  'zh-TW': '中文',
  en: 'English',
}

export const LOCALES: Locale[] = ['zh-TW', 'en']
