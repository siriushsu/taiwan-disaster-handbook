import zhTW from "./zh-TW.json";
import en from "./en.json";
import vi from "./vi.json";
import id from "./id.json";
import th from "./th.json";
import fil from "./fil.json";

export type Locale = "zh-TW" | "en" | "vi" | "id" | "th" | "fil";
export type TranslationKey = keyof typeof zhTW;

const translations: Record<Locale, Record<string, string>> = {
  "zh-TW": zhTW,
  en,
  vi,
  id,
  th,
  fil,
};

export function t(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string>,
): string {
  // Fall back chain: requested locale → English → Chinese → key
  let text =
    translations[locale]?.[key] ||
    translations.en[key] ||
    translations["zh-TW"][key] ||
    key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}

export const LOCALE_NAMES: Record<Locale, string> = {
  "zh-TW": "中文",
  en: "English",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  th: "ไทย",
  fil: "Filipino",
};

// Languages considered production-ready (fully translated + reviewed)
export const PRODUCTION_LOCALES: Locale[] = ["zh-TW", "en"];

// Languages in beta (machine-assisted, awaiting native speaker review)
export const BETA_LOCALES: Locale[] = ["vi", "id", "th", "fil"];

export const LOCALES: Locale[] = [...PRODUCTION_LOCALES, ...BETA_LOCALES];

export function isBetaLocale(locale: Locale): boolean {
  return BETA_LOCALES.includes(locale);
}
