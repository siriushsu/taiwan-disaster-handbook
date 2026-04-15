"use client";
import { useState, useRef, useEffect } from "react";
import {
  LOCALES,
  LOCALE_NAMES,
  BETA_LOCALES,
  isBetaLocale,
  type Locale,
} from "@/lib/i18n";

interface Props {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

export default function LocaleSwitcher({ locale, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-surface-muted transition-colors min-h-[44px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>🌐</span>
        <span>{LOCALE_NAMES[locale]}</span>
        {isBetaLocale(locale) && (
          <span className="text-[9px] uppercase tracking-wide text-warning ml-0.5">
            beta
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" className="opacity-50">
          <path
            d="M3 4.5 6 7.5 9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-deep border border-border py-1 min-w-[180px] z-50"
          role="listbox"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              onClick={() => {
                onChange(l);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                locale === l
                  ? "text-primary font-semibold bg-primary-light/50"
                  : "text-text hover:bg-surface-muted"
              }`}
              role="option"
              aria-selected={locale === l}
            >
              <span>{LOCALE_NAMES[l]}</span>
              {BETA_LOCALES.includes(l) && (
                <span className="text-[9px] uppercase tracking-wide text-warning font-semibold">
                  beta
                </span>
              )}
            </button>
          ))}
          <div className="border-t border-border/50 mt-1 pt-1 px-4 py-2 text-[10px] text-text-faint leading-relaxed">
            <p>Beta languages: machine-assisted translations.</p>
            <p className="mt-0.5">Help improve them on GitHub.</p>
          </div>
        </div>
      )}
    </div>
  );
}
