"use client";
import { useState } from "react";
import Link from "next/link";
import { FOREIGN_RESOURCES } from "@/lib/foreign-resources";

const NUMBERS = [
  {
    num: "119",
    label: "消防救護",
    en: "Fire / Ambulance",
    color: "bg-red-600",
    icon: "🚒",
  },
  { num: "110", label: "報警", en: "Police", color: "bg-blue-700", icon: "🚨" },
  {
    num: "1955",
    label: "外籍勞工專線",
    en: "Migrant Worker Hotline",
    color: "bg-emerald-600",
    icon: "📞",
    note: "中/英/越/印/泰",
  },
  {
    num: "113",
    label: "婦幼保護",
    en: "Women & Children",
    color: "bg-purple-600",
    icon: "🛡️",
  },
  {
    num: "1991",
    label: "災害留言板",
    en: "Disaster Message",
    color: "bg-amber-600",
    icon: "📝",
    note: "按1留言 按2聽",
  },
  {
    num: "1922",
    label: "疫情通報",
    en: "CDC Health",
    color: "bg-teal-600",
    icon: "🏥",
  },
];

export default function EmergencyPage() {
  const [showOffices, setShowOffices] = useState(false);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="text-center pt-6 pb-2 px-4">
        <h1 className="text-2xl font-bold text-red-400">緊急電話</h1>
        <p className="text-sm text-gray-400 mt-1">
          Emergency Numbers — 點擊即可撥打
        </p>
      </div>

      {/* Main buttons */}
      <div className="flex-1 px-4 pb-4 grid grid-cols-2 gap-3 max-w-lg mx-auto w-full">
        {NUMBERS.map((n) => (
          <a
            key={n.num}
            href={`tel:${n.num}`}
            className={`${n.color} rounded-2xl flex flex-col items-center justify-center py-6 px-3 active:scale-95 transition-transform shadow-lg`}
          >
            <span className="text-3xl mb-1">{n.icon}</span>
            <span className="text-4xl font-black tracking-wider">{n.num}</span>
            <span className="text-sm font-semibold mt-1 opacity-90">
              {n.label}
            </span>
            <span className="text-xs opacity-60">{n.en}</span>
            {n.note && (
              <span className="text-[10px] opacity-50 mt-0.5">{n.note}</span>
            )}
          </a>
        ))}
      </div>

      {/* Representative offices toggle */}
      <div className="px-4 pb-4 max-w-lg mx-auto w-full">
        <button
          onClick={() => setShowOffices(!showOffices)}
          className="w-full text-center py-3 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          {showOffices
            ? "▼ 關閉駐台辦事處 / Close Offices"
            : "▶ 駐台辦事處 / Representative Offices"}
        </button>

        {showOffices && (
          <div className="mt-3 space-y-2">
            {FOREIGN_RESOURCES.map((r) => (
              <a
                key={r.nationality}
                href={`tel:${r.embassyPhone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 active:bg-gray-800"
              >
                <div>
                  <span className="font-semibold text-sm">{r.nameZh}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {r.nameNative}
                  </span>
                </div>
                <span className="text-primary font-bold text-sm">
                  {r.embassyPhone}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center pb-6 space-y-2">
        <p className="text-xs text-gray-600">
          離線可用 / Works offline — 此頁面不需要網路
        </p>
        <Link href="/" className="text-xs text-primary hover:underline">
          ← 返回防災手冊 / Back to Handbook
        </Link>
      </div>
    </main>
  );
}
