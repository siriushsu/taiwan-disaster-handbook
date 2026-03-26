"use client";
import type { Member } from "@/types";
import { DISTRICTS } from "@/lib/districts";
import { DISTRICTS_EN } from "@/lib/districts-en";
import { CITIES } from "@/lib/cities";

const INPUT =
  "w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light";

interface Props {
  index: number;
  member: Member;
  onChange: (index: number, updated: Member) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  locale?: string;
}

export default function MemberForm({
  index,
  member,
  onChange,
  onRemove,
  canRemove,
  locale = "zh-TW",
}: Props) {
  const isEn = locale === "en";
  const update = (field: keyof Member, value: unknown) =>
    onChange(index, { ...member, [field]: value });

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-surface">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text">成員 {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-error/60 hover:text-error text-sm"
          >
            移除
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            姓名
          </label>
          <input
            type="text"
            value={member.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="例：王小明"
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            手機號碼
          </label>
          <input
            type="tel"
            value={member.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="例：0912-345-678"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">
          血型
        </label>
        <select
          value={member.bloodType}
          onChange={(e) => update("bloodType", e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
        >
          {["A", "B", "AB", "O", "不知道"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={member.isMobilityImpaired}
            onChange={(e) => update("isMobilityImpaired", e.target.checked)}
            className="rounded"
          />
          行動不便/輪椅
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={member.hasChronic}
            onChange={(e) => update("hasChronic", e.target.checked)}
            className="rounded"
          />
          有慢性病
        </label>
      </div>

      {member.hasChronic && (
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            長期用藥（藥名）
          </label>
          <input
            type="text"
            value={member.medications}
            onChange={(e) => update("medications", e.target.value)}
            placeholder="例：降血壓藥、胰島素"
            className={INPUT}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">
          過敏資訊（選填）
        </label>
        <input
          type="text"
          value={member.allergies}
          onChange={(e) => update("allergies", e.target.value)}
          placeholder="例：青黴素過敏、花生過敏"
          className={INPUT}
        />
      </div>

      {/* 白天地點 */}
      <div className="border-t border-border pt-3 space-y-2">
        <label className="block text-sm font-medium text-text-muted">
          白天上班/上學地點（選填）
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={member.dailyCity}
            onChange={(e) => {
              onChange(index, {
                ...member,
                dailyCity: e.target.value,
                dailyDistrict: "",
                dailyLocation: e.target.value
                  ? member.dailyLocation || "上班"
                  : "",
              });
            }}
            className={INPUT}
          >
            <option value="">縣市</option>
            {CITIES.map(([zh, en]) => (
              <option key={zh} value={zh}>
                {isEn ? `${en} ${zh}` : zh}
              </option>
            ))}
          </select>
          <select
            value={member.dailyDistrict}
            onChange={(e) => update("dailyDistrict", e.target.value)}
            className={INPUT}
          >
            <option value="">區</option>
            {(DISTRICTS[member.dailyCity] ?? []).map((d) => (
              <option key={d} value={d}>
                {isEn ? `${DISTRICTS_EN[d] || d} ${d}` : d}
              </option>
            ))}
          </select>
        </div>
        {member.dailyCity && (
          <input
            type="text"
            value={member.dailyAddress}
            onChange={(e) => update("dailyAddress", e.target.value)}
            placeholder="詳細地址（選填，填了會多查一組避難所）"
            className={INPUT}
          />
        )}
        {member.dailyCity && member.dailyLocation !== "上班" && (
          <input
            type="text"
            value={member.dailyLocation === "上班" ? "" : member.dailyLocation}
            onChange={(e) => update("dailyLocation", e.target.value || "上班")}
            placeholder="例：上班、上學、其他"
            className={`${INPUT} text-xs`}
          />
        )}
        {member.dailyCity && member.dailyLocation === "上班" && (
          <button
            type="button"
            onClick={() => update("dailyLocation", " ")}
            className="text-xs text-text-faint hover:text-text-muted"
          >
            預設：上班（<span className="underline">點此修改為上學或其他</span>
            ）
          </button>
        )}
      </div>

      {/* 不同住址 */}
      <div className="border-t border-border pt-3">
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={member.hasDifferentAddress}
            onChange={(e) => update("hasDifferentAddress", e.target.checked)}
            className="rounded"
          />
          此成員住址與主住家不同
        </label>

        {member.hasDifferentAddress && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  縣市
                </label>
                <select
                  value={member.city}
                  onChange={(e) =>
                    onChange(index, {
                      ...member,
                      city: e.target.value,
                      district: "",
                    })
                  }
                  className={INPUT}
                >
                  <option value="">請選擇</option>
                  {CITIES.map(([zh, en]) => (
                    <option key={zh} value={zh}>
                      {isEn ? `${en} ${zh}` : zh}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  區/鄉/鎮市
                </label>
                <select
                  value={member.district}
                  onChange={(e) => update("district", e.target.value)}
                  className={INPUT}
                >
                  <option value="">請選擇</option>
                  {(DISTRICTS[member.city] ?? []).map((d) => (
                    <option key={d} value={d}>
                      {isEn ? `${DISTRICTS_EN[d] || d} ${d}` : d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                詳細地址
              </label>
              <input
                type="text"
                value={member.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="例：中山路一段 100 號"
                className={INPUT}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
