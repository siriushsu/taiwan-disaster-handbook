"use client";
/**
 * Emergency Card — mobile-friendly HTML version
 * Shows family reunification info at a glance:
 * - Where each family member usually is (daily location)
 * - Emergency contacts with phone numbers
 * - Meeting point
 * - Key emergency numbers
 */
import type { HandbookData } from "@/types";
import { t, type Locale, type TranslationKey } from "@/lib/i18n";

export default function EmergencyCardView({
  data,
  locale = "zh-TW",
}: {
  data: HandbookData;
  locale?: Locale;
}) {
  const { household, locations } = data;
  const members = household.members.filter((m) => m.name);
  const contacts = household.contacts.filter((c) => c.name);
  const mainAddr = `${household.city}${household.district}${household.address}`;
  const T = (key: TranslationKey) => t(locale, key);
  // Section labels stay bilingual for non-zh users: the card is shown to
  // Taiwanese rescuers/officials, so Chinese must remain visible.
  const L = (key: TranslationKey) =>
    locale === "zh-TW"
      ? t("zh-TW", key)
      : `${t(locale, key)} / ${t("zh-TW", key)}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-4 py-3">
        <h3 className="text-white font-bold text-base">{L("card_title")}</h3>
        <p className="text-white/70 text-xs mt-0.5">{T("card_subtitle")}</p>
      </div>

      <div className="p-4 space-y-4 text-sm">
        {/* Family members + daily locations */}
        <section>
          <h4 className="text-xs font-bold text-primary border-b border-border pb-1 mb-2">
            {L("card_family")}
          </h4>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div key={i} className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <span className="font-semibold text-text">{m.name}</span>
                  {m.bloodType && m.bloodType !== "不知道" && (
                    <span className="text-xs text-text-faint ml-1">
                      ({m.bloodType}型)
                    </span>
                  )}
                  {m.dailyLocation && (
                    <p className="text-xs text-text-muted truncate">
                      {m.dailyLocation}
                      {m.dailyAddress &&
                        ` - ${m.dailyCity}${m.dailyDistrict}${m.dailyAddress}`}
                    </p>
                  )}
                  {!m.dailyLocation && (
                    <p className="text-xs text-text-faint">{mainAddr}</p>
                  )}
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="text-xs text-primary font-mono"
                    >
                      {m.phone}
                    </a>
                  )}
                </div>
                {m.medications && (
                  <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded shrink-0">
                    {m.medications.length > 8
                      ? m.medications.slice(0, 8) + "..."
                      : m.medications}
                  </span>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-xs text-text-faint">{T("card_no_members")}</p>
            )}
          </div>
        </section>

        {/* Emergency contacts */}
        <section>
          <h4 className="text-xs font-bold text-primary border-b border-border pb-1 mb-2">
            {L("card_contacts")}
          </h4>
          <div className="space-y-1.5">
            {contacts.map((c, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-text">{c.name}</span>
                  <span className="text-xs text-text-faint ml-1">
                    ({c.relation})
                  </span>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="text-primary font-mono text-xs underline"
                >
                  {c.phone}
                </a>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-xs text-text-faint">{T("card_no_contacts")}</p>
            )}
          </div>
        </section>

        {/* Nearest shelter as meeting point */}
        {locations[0]?.shelters[0] && (
          <section>
            <h4 className="text-xs font-bold text-primary border-b border-border pb-1 mb-2">
              {L("card_meeting")}
            </h4>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-text">
                  {locations[0].shelters[0].name}
                </p>
                <p className="text-xs text-text-muted">
                  {locations[0].shelters[0].address}
                </p>
              </div>
              {locations[0].shelters[0].distance && (
                <span className="text-xs text-primary shrink-0">
                  {locations[0].shelters[0].distance < 1000
                    ? `${Math.round(locations[0].shelters[0].distance)}m`
                    : `${(locations[0].shelters[0].distance / 1000).toFixed(1)}km`}
                </span>
              )}
            </div>
          </section>
        )}

        {/* Emergency numbers */}
        <section>
          <h4 className="text-xs font-bold text-primary border-b border-border pb-1 mb-2">
            {L("card_numbers")}
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">{T("label_fire_amb")}</span>
              <a href="tel:119" className="font-bold text-red-600">
                119
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{T("label_police")}</span>
              <a href="tel:110" className="font-bold text-red-600">
                110
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">
                {T("label_disaster_report")}
              </span>
              <a href="tel:1991" className="font-bold text-text">
                1991
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">{T("label_poison")}</span>
              <a href="tel:0800-008-092" className="font-bold text-text">
                0800-008-092
              </a>
            </div>
          </div>
          <p className="text-[10px] text-text-faint mt-1.5">
            {T("card_1991_hint")}
          </p>
        </section>

        {/* Nearest fire station + police */}
        {(locations[0]?.fireStation?.[0] ||
          locations[0]?.policeStation?.[0]) && (
          <section>
            <h4 className="text-xs font-bold text-primary border-b border-border pb-1 mb-2">
              {L("card_nearby")}
            </h4>
            <div className="space-y-1 text-xs">
              {locations[0]?.fireStation?.[0] && (
                <div className="flex justify-between">
                  <span className="text-text">
                    {locations[0].fireStation[0].name}
                  </span>
                  <a
                    href={`tel:${locations[0].fireStation[0].phone}`}
                    className="text-primary underline"
                  >
                    {locations[0].fireStation[0].phone}
                  </a>
                </div>
              )}
              {locations[0]?.policeStation?.[0] && (
                <div className="flex justify-between">
                  <span className="text-text">
                    {locations[0].policeStation[0].name}
                  </span>
                  <a
                    href={`tel:${locations[0].policeStation[0].phone}`}
                    className="text-primary underline"
                  >
                    {locations[0].policeStation[0].phone}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
