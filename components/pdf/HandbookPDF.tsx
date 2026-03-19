import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import type { HandbookData, LocationInfo, Shelter, MedicalFacility, Member } from '@/types'
import { FOREIGN_RESOURCES, FOREIGN_HOTLINES } from '@/lib/foreign-resources'
import { pt, ptEn, type BiMode } from '@/lib/pdf-i18n'

// Fonts served from jsDelivr CDN (free, unlimited bandwidth)
// Pin to commit hash to bust jsDelivr cache after font re-subset
const CDN_FONTS = 'https://cdn.jsdelivr.net/gh/siriushsu/taiwan-disaster-handbook@71b728b/public/fonts'
Font.register({
  family: 'NotoSansTC',
  fonts: [
    { src: `${CDN_FONTS}/NotoSansTC-Regular-subset.ttf?v=2`, fontWeight: 'normal' },
    { src: `${CDN_FONTS}/NotoSansTC-Bold-subset.ttf?v=2`, fontWeight: 'bold' },
  ],
})

/* ── helpers ───────────────────────────────────────── */
let _lang: BiMode = 'zh'
let _origin = ''

function staticMapUrl(loc: LocationInfo): string | null {
  if (!loc.geo || !_origin) return null
  const { lat, lng } = loc.geo
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: '15',
    size: '600x300',
  })
  // Home: red
  params.append('m', `${lat},${lng},ol-marker-red`)
  // Shelters: blue (top 3)
  loc.shelters.slice(0, 3).forEach((s: Shelter) => {
    if (s.lat && s.lng) params.append('m', `${s.lat},${s.lng},ol-marker`)
  })
  // Air raid: gold (top 2)
  ;(loc.airRaid ?? []).slice(0, 2).forEach((s: Shelter) => {
    if (s.lat && s.lng) params.append('m', `${s.lat},${s.lng},ol-marker-gold`)
  })
  // Medical: green (top 2)
  loc.medical.slice(0, 2).forEach((m: MedicalFacility) => {
    if (m.lat && m.lng) params.append('m', `${m.lat},${m.lng},ol-marker-green`)
  })
  return `${_origin}/api/staticmap?${params.toString()}`
}
function distText(m?: number) {
  if (!m) return ''
  if (_lang === 'en') return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
  return m < 1000 ? `${m} ${pt(_lang, 'dist_meters')}` : `${(m / 1000).toFixed(1)} ${pt(_lang, 'dist_km')}`
}
function walkMin(m?: number) {
  if (!m) return ''
  const mins = Math.ceil(m / 80)
  if (_lang === 'en') return mins <= 1 ? '~1 min walk' : `~${mins} min walk`
  return mins <= 1 ? pt(_lang, 'walk_1min') : `${pt(_lang, 'walk_about')} ${mins} ${pt(_lang, 'walk_min')}`
}
function memberAddr(m: Member, householdAddr: string) {
  if (m.hasDifferentAddress && m.city && m.address) return `${m.city}${m.district}${m.address}`
  return householdAddr
}

/* ── styles ────────────────────────────────────────── */
const s = StyleSheet.create({
  page: { fontFamily: 'NotoSansTC', padding: '28 36', fontSize: 10, color: '#1a1a1a', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 14, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7.5, color: '#9ca3af' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#3b82f6', borderBottomWidth: 1, borderBottomColor: '#bfdbfe', paddingBottom: 3, marginBottom: 6, marginTop: 10 },
  twoCol: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  // cover
  coverPage: { fontFamily: 'NotoSansTC', padding: 0, backgroundColor: '#3b82f6' },
  coverTop: { padding: '60 40 40', flex: 1 },
  coverTitle: { fontSize: 32, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 },
  coverSub: { fontSize: 14, color: '#bfdbfe', marginBottom: 30 },
  coverBox: { backgroundColor: '#3b6fd4', borderRadius: 8, padding: '14 20', marginBottom: 10 },
  coverBoxLabel: { fontSize: 9, color: '#93c5fd', marginBottom: 3 },
  coverBoxValue: { fontSize: 13, color: '#ffffff', fontWeight: 'bold' },
  coverFooter: { backgroundColor: '#3b6fd4', padding: '14 40', fontSize: 9, color: '#93c5fd' },
  // action card
  actionPage: { fontFamily: 'NotoSansTC', padding: '20 30', fontSize: 10, color: '#1a1a1a', backgroundColor: '#fef9f0' },
  actionBanner: { backgroundColor: '#e04545', padding: '10 14', borderRadius: 8, marginBottom: 12 },
  actionBannerText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  actionBannerSub: { color: '#fecaca', fontSize: 9, textAlign: 'center', marginTop: 2 },
  actionRow: { flexDirection: 'row', borderWidth: 2, borderRadius: 8, padding: '8 12', marginBottom: 8, alignItems: 'flex-start' },
  actionEmoji: { fontSize: 20, marginRight: 10, width: 30 },
  actionLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  actionBody: { fontSize: 9.5, color: '#374151', lineHeight: 1.4 },
  actionMeet: { backgroundColor: '#3b82f6', borderRadius: 8, padding: '10 14', marginTop: 4, marginBottom: 8 },
  actionMeetLabel: { color: '#93c5fd', fontSize: 8, fontWeight: 'bold' },
  actionMeetValue: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  actionMeetDist: { color: '#bfdbfe', fontSize: 9, marginTop: 2 },
  // numbers
  numRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#fee2e2' },
  numBig: { fontSize: 20, fontWeight: 'bold', color: '#e04545', width: 100 },
  numLabel: { flex: 1, fontSize: 10, color: '#374151' },
  // contact card
  contactCard: { backgroundColor: '#eff6ff', borderRadius: 6, padding: '8 12', marginBottom: 6, borderLeftWidth: 4, borderLeftColor: '#3b6fd4' },
  contactName: { fontWeight: 'bold', fontSize: 11 },
  contactPhone: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6', marginTop: 4, lineHeight: 1.2 },
  contactMeta: { fontSize: 8, color: '#6b7280', marginTop: 4 },
  // reunion
  reunionBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: '8 12', marginBottom: 6 },
  reunionName: { fontWeight: 'bold', fontSize: 10.5, color: '#3b82f6' },
  reunionRow: { flexDirection: 'row', marginTop: 3 },
  reunionLabel: { width: 60, color: '#6b7280', fontSize: 8.5 },
  reunionValue: { flex: 1, fontSize: 8.5 },
  // location
  locHeader: { backgroundColor: '#3b82f6', padding: '10 14', borderRadius: 6, marginBottom: 10 },
  locTitle: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  locAddr: { fontSize: 9, color: '#bfdbfe', marginTop: 2 },
  shelterCard: { flexDirection: 'row', marginBottom: 5, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  shelterNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#3b6fd4', color: '#fff', fontSize: 10, fontWeight: 'bold', textAlign: 'center', paddingTop: 4, marginRight: 8, flexShrink: 0 },
  shelterInfo: { flex: 1 },
  shelterName: { fontWeight: 'bold', fontSize: 10.5 },
  shelterAddr: { color: '#6b7280', fontSize: 8.5 },
  shelterDist: { color: '#059669', fontSize: 8.5 },
  shelterTag: { fontSize: 7.5, color: '#8b5cf6', marginTop: 1 },
  medCard: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  meetBox: { flexDirection: 'row', gap: 8, marginTop: 4 },
  meetCard: { flex: 1, borderRadius: 6, padding: '8 10' },
  meetLabel: { fontSize: 8, fontWeight: 'bold', marginBottom: 2 },
  meetValue: { fontSize: 9.5, fontWeight: 'bold' },
  // personal card
  pCard: { borderWidth: 1.5, borderColor: '#374151', borderRadius: 6, padding: '8 10', marginBottom: 8, borderStyle: 'dashed' },
  pCardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4, marginBottom: 4 },
  pCardName: { fontWeight: 'bold', fontSize: 12, color: '#3b82f6' },
  pCardBlood: { fontWeight: 'bold', fontSize: 11, color: '#e04545' },
  pCardRow: { flexDirection: 'row', marginTop: 2 },
  pCardLabel: { width: 52, color: '#6b7280', fontSize: 8 },
  pCardValue: { flex: 1, fontSize: 8 },
  // checklist
  checkItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  checkbox: { width: 11, height: 11, borderWidth: 1, borderColor: '#9ca3af', borderRadius: 2, marginRight: 6, marginTop: 1.5, flexShrink: 0 },
  checkText: { flex: 1, fontSize: 9.5 },
  checkCat: { fontWeight: 'bold', fontSize: 10.5, color: '#374151', marginBottom: 5, marginTop: 8 },
  // scenario
  scenarioTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 2 },
  step: { flexDirection: 'row', marginBottom: 5 },
  stepNum: { width: 18, height: 18, borderRadius: 9, marginRight: 8, fontSize: 9, fontWeight: 'bold', textAlign: 'center', paddingTop: 3.5, flexShrink: 0, color: '#ffffff' },
  stepText: { flex: 1, fontSize: 9.5 },
  warningBox: { borderRadius: 6, padding: '6 10', marginTop: 4, marginBottom: 4 },
  tipBox: { backgroundColor: '#eff6ff', borderRadius: 6, padding: '6 10', marginTop: 4, marginBottom: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  tipText: { fontSize: 8.5, color: '#3b82f6' },
  // member health
  memberCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, padding: '8 12', marginBottom: 8 },
  memberName: { fontWeight: 'bold', fontSize: 12, color: '#3b82f6' },
  infoRow: { flexDirection: 'row', marginTop: 4 },
  infoLabel: { width: 70, color: '#6b7280', fontSize: 9 },
  infoValue: { flex: 1, fontSize: 9 },
  alertBadge: { backgroundColor: '#fef2f2', borderRadius: 4, padding: '2 6', marginTop: 3, alignSelf: 'flex-start' },
  alertText: { color: '#e04545', fontSize: 8.5 },
  noDataBox: { backgroundColor: '#fef9c3', borderRadius: 6, padding: '8 12', marginBottom: 6 },
})

function Footer({ label, biMode = 'zh' }: { label: string; biMode?: BiMode }) {
  return <View style={s.footer} fixed>
    <Text style={s.footerText}>{pt(biMode, 'label_footer_handbook')}</Text>
    <Text style={s.footerText}>{label}</Text>
  </View>
}

/* ══════════════════════════════════════════════════════
   PAGE: Location Evacuation Guide
   ══════════════════════════════════════════════════════ */
function DirItem({ item }: { item: { name: string; dir: string; dist: string; color: string; tag: string } }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <View style={{ width: 28, height: 16, borderRadius: 3, backgroundColor: item.color, marginRight: 5, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 6.5, color: '#fff', fontWeight: 'bold' }}>{item.dir}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name}</Text>
        <Text style={{ fontSize: 7, color: '#6b7280' }}>{item.tag}　{item.dist}</Text>
      </View>
    </View>
  )
}

function DirMap({ loc, biMode = 'zh' }: { loc: LocationInfo; biMode?: BiMode }) {
  if (!loc.geo) return null

  // Prefer static map URL via proxy (avoids CORS issues)
  const mapUrl = staticMapUrl(loc)
  if (mapUrl) {
    return (
      <View style={{ marginBottom: 8 }}>
        <Image src={mapUrl} style={{ width: '100%', height: 160, borderRadius: 4, objectFit: 'cover' }} />
        <View style={{ flexDirection: 'row', marginTop: 3 }}>
          <Text style={{ fontSize: 7, color: '#6b7280' }}>• {pt(_lang, 'map_legend_full')}</Text>
          <Text style={{ fontSize: 7, color: '#9ca3af', marginLeft: 8 }}>Map © OpenStreetMap</Text>
        </View>
      </View>
    )
  }
  const shelters = loc.shelters.filter((sh: Shelter) => sh.type !== 'air_defense').slice(0, 3)
  const airRaid = (loc.airRaid ?? []).slice(0, 2)
  const medical = loc.medical.slice(0, 2)
  const items: { name: string; dir: string; dist: string; color: string; tag: string }[] = []
  for (const sh of shelters) {
    if (sh.lat && sh.lng) items.push({ name: sh.name, dir: bearing(loc.geo.lat, loc.geo.lng, sh.lat, sh.lng), dist: distText(sh.distance), color: '#3b82f6', tag: pt(_lang, 'label_shelter') })
  }
  for (const sh of airRaid) {
    if (sh.lat && sh.lng) items.push({ name: sh.address || sh.name, dir: bearing(loc.geo.lat, loc.geo.lng, sh.lat, sh.lng), dist: distText(sh.distance), color: '#8b5cf6', tag: pt(_lang, 'label_air_raid') })
  }
  for (const m of medical) {
    if (m.lat && m.lng) items.push({ name: m.name, dir: bearing(loc.geo.lat, loc.geo.lng, m.lat, m.lng), dist: distText(m.distance), color: '#059669', tag: m.hasER ? pt(_lang, 'label_er') : pt(_lang, 'label_medical') })
  }
  if (items.length === 0) return null
  return (
    <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: '8 12', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>{pt(_lang, 'loc_dir')}</Text>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {items.filter((_, i) => i % 2 === 0).map((item, i) => <DirItem key={i} item={item} />)}
        </View>
        <View style={{ flex: 1 }}>
          {items.filter((_, i) => i % 2 === 1).map((item, i) => <DirItem key={i} item={item} />)}
        </View>
      </View>
      <Text style={{ fontSize: 6.5, color: '#9ca3af', marginTop: 3 }}>{pt(_lang, 'map_legend_short')}</Text>
    </View>
  )
}

function LocationPage({ loc, mapImg, biMode = 'zh' }: { loc: LocationInfo; mapImg?: string; biMode?: BiMode }) {
  const natural = loc.shelters.filter((sh: Shelter) => sh.type !== 'air_defense')
  const air = loc.airRaid ?? []
  const mainShelter = natural[0]
  const backupShelter = natural[1]
  const isBasement = /^[Bb]|地下/.test(loc.floor ?? '')

  return (
    <Page size="A4" style={s.page}>
      <View style={s.locHeader}>
        <Text style={s.locTitle}>{loc.label}　{pt(biMode, 'loc_evac_guide_suffix')}{biMode !== 'zh' ? ' / ' + ptEn('loc_evac_guide_suffix') : ''}</Text>
        <Text style={s.locAddr}>{loc.address}</Text>
        {loc.housingType === 'apartment' && loc.floor
          ? <Text style={s.locAddr}>{pt(biMode, 'loc_apt_building')} {loc.floor} {pt(biMode, 'loc_floor_suffix')}{biMode !== 'zh' ? ' / Apt Bldg' : ''}</Text>
          : null}
      </View>

      <DirMap loc={loc} biMode={biMode} />

      {/* Meeting Points */}
      <Text style={s.sectionTitle}>{pt(biMode, 'loc_meeting')}</Text>
      {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_meeting')}</Text>}
      <Text style={{ fontSize: 8.5, color: '#6b7280', marginBottom: biMode !== 'zh' ? 1 : 4 }}>
        {pt(biMode, 'loc_meeting_desc')}
      </Text>
      {biMode !== 'zh' && <Text style={{ fontSize: 7.5, color: '#6b7280', marginBottom: 4 }}>{ptEn('loc_meeting_desc')}</Text>}
      <View style={s.meetBox}>
        <View style={[s.meetCard, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
          <Text style={[s.meetLabel, { color: '#3b82f6' }]}>{pt(biMode, 'loc_primary')}{biMode !== 'zh' ? ' / ' + ptEn('loc_primary') : ''}</Text>
          <Text style={s.meetValue}>{mainShelter?.name ?? pt(biMode, 'loc_fallback_primary')}</Text>
          {mainShelter?.address ? <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{mainShelter.address}</Text> : null}
          {mainShelter?.distance ? <Text style={{ fontSize: 8, color: '#059669', marginTop: 1 }}>{distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}）</Text> : null}
        </View>
        <View style={[s.meetCard, { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' }]}>
          <Text style={[s.meetLabel, { color: '#c2410c' }]}>{pt(biMode, 'loc_backup')}{biMode !== 'zh' ? ' / ' + ptEn('loc_backup') : ''}</Text>
          <Text style={s.meetValue}>{backupShelter?.name ?? pt(biMode, 'loc_fallback_backup')}</Text>
          {backupShelter?.address ? <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{backupShelter.address}</Text> : null}
          {backupShelter?.distance ? <Text style={{ fontSize: 8, color: '#059669', marginTop: 1 }}>{distText(backupShelter.distance)}（{walkMin(backupShelter.distance)}）</Text> : null}
        </View>
      </View>

      {/* Nearest shelters */}
      <Text style={s.sectionTitle}>{pt(biMode, 'loc_shelters')}</Text>
      {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_shelters')}</Text>}
      {natural.length > 0 ? natural.map((sh: Shelter, i: number) => (
        <View key={i} style={s.shelterCard}>
          <Text style={s.shelterNum}>{i + 1}</Text>
          <View style={s.shelterInfo}>
            <Text style={s.shelterName}>{sh.name}</Text>
            {sh.address ? <Text style={s.shelterAddr}>{sh.address}</Text> : null}
            <Text style={s.shelterDist}>
              {distText(sh.distance)}（{walkMin(sh.distance)}）
              {sh.capacity ? `　${pt(biMode, 'loc_capacity_prefix')} ${sh.capacity.toLocaleString()} ${pt(biMode, 'loc_capacity_suffix')}` : ''}
              {sh.indoor ? `　${pt(biMode, 'label_indoor')}` : ''}
            </Text>
            {sh.disasterTypes ? <Text style={s.shelterAddr}>{pt(biMode, 'label_applicable')}：{sh.disasterTypes}</Text> : null}
            {sh.phone ? <Text style={s.shelterAddr}>{pt(biMode, 'label_mgmt_phone')}：{sh.phone}</Text> : null}
            {sh.vulnerableFriendly ? <Text style={{ fontSize: 7.5, color: '#059669', marginTop: 1 }}>{pt(biMode, 'label_vulnerable')}</Text> : null}
          </View>
        </View>
      )) : (
        <View style={s.noDataBox}>
          <Text style={{ fontSize: 9, color: '#854d0e' }}>
            {pt(biMode, 'loc_no_data')}
          </Text>
        </View>
      )}
      <Text style={s.shelterTag}>{pt(biMode, 'loc_shelters_src')}</Text>

      {/* Air defense shelters */}
      {air.length > 0 && (<>
        <Text style={s.sectionTitle}>{pt(biMode, 'loc_airraid')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_airraid')}</Text>}
        {air.slice(0, 3).map((sh: Shelter, i: number) => (
          <View key={i} style={s.shelterCard}>
            <Text style={[s.shelterNum, { backgroundColor: '#8b5cf6' }]}>{i + 1}</Text>
            <View style={s.shelterInfo}>
              <Text style={s.shelterName}>{sh.name}</Text>
              {sh.address ? <Text style={s.shelterAddr}>{sh.address}</Text> : null}
              <Text style={s.shelterDist}>{distText(sh.distance)}（{walkMin(sh.distance)}）</Text>
            </View>
          </View>
        ))}
      </>)}

      {/* Medical */}
      {loc.medical.length > 0 && (<>
        <Text style={s.sectionTitle}>{pt(biMode, 'loc_medical')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_medical')}</Text>}
        {loc.medical.slice(0, 3).map((m: MedicalFacility, i: number) => (
          <View key={i} style={s.medCard}>
            <Text style={[s.shelterNum, { backgroundColor: '#059669' }]}>{i + 1}</Text>
            <View style={s.shelterInfo}>
              <Text style={s.shelterName}>{m.name}</Text>
              {m.address ? <Text style={s.shelterAddr}>{m.address}</Text> : null}
              <Text style={s.shelterDist}>
                {m.type === 'hospital' ? pt(biMode, 'label_hospital') : pt(biMode, 'label_clinic')}
                {m.hasER ? pt(biMode, 'label_has_er_paren') : ''}
                　{distText(m.distance)}（{walkMin(m.distance)}）
                {m.phone ? `　${m.phone}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </>)}

      {/* Apartment-specific evacuation */}
      {loc.housingType === 'apartment' && (<>
        <Text style={s.sectionTitle}>{pt(biMode, 'loc_apt_title')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_apt_title')}</Text>}
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {[
            [
              isBasement
                ? `${pt(biMode, 'apt_basement_prefix')} ${loc.floor} ${pt(biMode, 'loc_floor_suffix')}。${pt(biMode, 'apt_basement_eq')}`
                : `${pt(biMode, 'apt_1_pre')} ${loc.floor || '?'} ${pt(biMode, 'apt_1_post')}`,
              isBasement
                ? `${ptEn('apt_basement_prefix')} ${loc.floor} ${ptEn('loc_floor_suffix')}. ${ptEn('apt_basement_eq')}`
                : `${ptEn('apt_1_pre')} ${loc.floor || '?'} ${ptEn('apt_1_post')}`,
            ],
            [
              isBasement ? pt(biMode, 'apt_basement_flood') : pt(biMode, 'apt_2'),
              isBasement ? ptEn('apt_basement_flood') : ptEn('apt_2'),
            ],
            [pt(biMode, 'apt_3'), ptEn('apt_3')],
            [pt(biMode, 'apt_4'), ptEn('apt_4')],
            [
              `${pt(biMode, 'apt_go_to_meeting')}${mainShelter?.name ?? pt(biMode, 'loc_fallback_plaza')}`,
              `${ptEn('apt_go_to_meeting')}${mainShelter?.name ?? ptEn('loc_fallback_plaza')}`,
            ],
          ].map(([zh, en], i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9 }}>{zh}</Text>
                {biMode !== 'zh' && <Text style={{ fontSize: 7.5, color: '#6b7280' }}>{en}</Text>}
              </View>
            </View>
          ))}
        </View>
      </>)}

      {loc.housingType === 'house' && (<>
        <Text style={s.sectionTitle}>{pt(biMode, 'loc_house_title')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_house_title')}</Text>}
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {[
            [pt(biMode, 'house_1'), ptEn('house_1')],
            [pt(biMode, 'house_2'), ptEn('house_2')],
            [pt(biMode, 'house_3'), ptEn('house_3')],
            [
              `${pt(biMode, 'house_4_prefix')}${mainShelter?.name ?? pt(biMode, 'loc_fallback_plaza')}`,
              `${ptEn('house_4_prefix')}${mainShelter?.name ?? ptEn('loc_fallback_plaza')}`,
            ],
          ].map(([zh, en], i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9 }}>{zh}</Text>
                {biMode !== 'zh' && <Text style={{ fontSize: 7.5, color: '#6b7280' }}>{en}</Text>}
              </View>
            </View>
          ))}
        </View>
      </>)}

      <Footer label={`${loc.label} ${pt(biMode, 'loc_evac_guide_footer')}`} biMode={biMode} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
function qrUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(text)}`
}

/* Bearing from home to a point, returns compass direction */
function bearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const dLng = (lng2 - lng1) * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180)
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng)
  const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  if (deg < 22.5 || deg >= 337.5) return pt(_lang, 'compass_n')
  if (deg < 67.5) return pt(_lang, 'compass_ne')
  if (deg < 112.5) return pt(_lang, 'compass_e')
  if (deg < 157.5) return pt(_lang, 'compass_se')
  if (deg < 202.5) return pt(_lang, 'compass_s')
  if (deg < 247.5) return pt(_lang, 'compass_sw')
  if (deg < 292.5) return pt(_lang, 'compass_w')
  return pt(_lang, 'compass_nw')
}

/* Direction map component: shows shelters relative to home */
function DirectionMap({ loc }: { loc: LocationInfo }) {
  if (!loc.geo) return null
  const natural = loc.shelters.filter((sh: Shelter) => sh.type !== 'air_defense').slice(0, 3)
  const air = (loc.airRaid ?? []).slice(0, 2)
  const med = loc.medical.slice(0, 2)
  const items: { name: string; dir: string; dist: string; color: string; tag: string }[] = []
  natural.forEach(s => {
    if (s.lat && s.lng) items.push({
      name: s.name, dir: bearing(loc.geo!.lat, loc.geo!.lng, s.lat, s.lng),
      dist: distText(s.distance), color: '#3b82f6', tag: pt(_lang, 'label_shelter')
    })
  })
  air.forEach(s => {
    if (s.lat && s.lng) items.push({
      name: s.address || s.name, dir: bearing(loc.geo!.lat, loc.geo!.lng, s.lat, s.lng),
      dist: distText(s.distance), color: '#8b5cf6', tag: pt(_lang, 'label_air_raid')
    })
  })
  med.forEach(m => {
    if (m.lat && m.lng) items.push({
      name: m.name, dir: bearing(loc.geo!.lat, loc.geo!.lng, m.lat, m.lng),
      dist: distText(m.distance), color: '#059669', tag: m.hasER ? pt(_lang, 'label_er') : pt(_lang, 'label_medical')
    })
  })
  if (items.length === 0) return null

  // Split into two columns manually
  const left = items.filter((_, i) => i % 2 === 0)
  const right = items.filter((_, i) => i % 2 === 1)

  const renderItem = (item: typeof items[0], i: number) => (
    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <View style={{ width: 28, height: 16, borderRadius: 3, backgroundColor: item.color, marginRight: 5, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 6.5, color: '#fff', fontWeight: 'bold' }}>{item.dir}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{item.name.length > 12 ? item.name.slice(0, 12) + '...' : item.name}</Text>
        <Text style={{ fontSize: 7, color: '#6b7280' }}>{item.tag}　{item.dist}</Text>
      </View>
    </View>
  )

  return (
    <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: '8 12', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>{pt(_lang, 'loc_dir')}</Text>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {left.map((item, i) => renderItem(item, i))}
        </View>
        <View style={{ flex: 1 }}>
          {right.map((item, i) => renderItem(item, i))}
        </View>
      </View>
      <Text style={{ fontSize: 6.5, color: '#9ca3af', marginTop: 3 }}>{pt(_lang, 'map_legend_short')}　{pt(_lang, 'map_dir_from_home')}</Text>
    </View>
  )
}

/** Bilingual text: shows Chinese + English subtitle when bi mode */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Bi({ mode, k, style }: { mode: BiMode; k: string; style?: any }) {
  if (mode === 'zh') return <Text style={style}>{pt(mode, k)}</Text>
  return (
    <View>
      <Text style={style}>{pt(mode, k)}</Text>
      <Text style={{ fontSize: 7.5, color: '#6b7280', marginTop: 1 }}>{ptEn(k)}</Text>
    </View>
  )
}

export default function HandbookPDF({ data, mapImages, biMode = 'zh', origin = '' }: { data: HandbookData; mapImages?: Record<number, string>; biMode?: BiMode; origin?: string }) {
  _lang = biMode
  _origin = origin
  const { household } = data
  const allMembers = household.members.filter(m => m.name)
  const allContacts = household.contacts.filter(c => c.name && c.phone)
  const outOfCityContact = allContacts.find(c => c.isOutOfCity)
  const mainLocation = data.locations[0]
  const mainShelter = mainLocation?.shelters[0]
  const mainHospital = mainLocation?.medical?.find((m: MedicalFacility) => m.type === 'hospital') ?? mainLocation?.medical?.[0]
  const fullAddr = `${household.city}${household.district}${household.address}`

  return (
    <Document title={`${pt(biMode, 'cover_title')} - ${allMembers[0]?.name ?? '—'}`} language={biMode === 'en' ? 'en' : 'zh-TW'}>

      {/* ─── PAGE 1: COVER ─── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          <Text style={s.coverTitle}>{pt(biMode, 'cover_title')}</Text>
          {biMode === 'bi' && <Text style={[s.coverSub, { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }]}>Family Emergency Handbook</Text>}
          <Text style={s.coverSub}>{pt(biMode, 'cover_sub')}</Text>
          {biMode === 'bi' && <Text style={[s.coverSub, { fontSize: 10 }]}>{ptEn('cover_sub')}</Text>}
          <View style={s.coverBox}>
            <Text style={s.coverBoxLabel}>{pt(biMode, 'cover_addr')}{biMode === 'bi' ? ' / Home Address' : ''}</Text>
            <Text style={s.coverBoxValue}>{fullAddr}</Text>
          </View>
          <View style={s.coverBox}>
            <Text style={s.coverBoxLabel}>{pt(biMode, 'cover_members')}{biMode === 'bi' ? ' / Family Members' : ''}</Text>
            <Text style={s.coverBoxValue}>{allMembers.map(m => m.name).join('、') || '—'}</Text>
          </View>
          {mainShelter && (
            <View style={s.coverBox}>
              <Text style={s.coverBoxLabel}>{pt(biMode, 'cover_meeting')}{biMode === 'bi' ? ' / Meeting Point' : ''}</Text>
              <Text style={s.coverBoxValue}>{mainShelter.name}</Text>
              <Text style={{ color: '#93c5fd', fontSize: 9, marginTop: 2 }}>
                {distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}）
              </Text>
            </View>
          )}
          {outOfCityContact && (
            <View style={s.coverBox}>
              <Text style={s.coverBoxLabel}>{pt(biMode, 'cover_contact')}{biMode === 'bi' ? ' / ' + ptEn('cover_contact') : ''}</Text>
              <Text style={s.coverBoxValue}>{outOfCityContact.name}</Text>
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 }}>{outOfCityContact.phone}</Text>
            </View>
          )}
          <View style={[s.coverBox, { marginTop: 12 }]}>
            <Text style={s.coverBoxLabel}>{pt(biMode, 'cover_date')}{biMode === 'bi' ? ' / Created' : ''}</Text>
            <Text style={{ color: '#ffffff', fontSize: 11 }}>{data.generatedAt}　{pt(biMode, 'cover_update')}{biMode !== 'zh' ? ' / ' + ptEn('cover_update') : ''}</Text>
          </View>
        </View>
        <View style={s.coverFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text>{pt(biMode, 'cover_footer')}</Text>
              {biMode !== 'zh' && <Text style={{ fontSize: 8, color: '#bfdbfe', marginTop: 1 }}>{ptEn('cover_footer')}</Text>}
              <Text style={{ marginTop: 3 }}>{pt(biMode, 'cover_qr')}</Text>
              {biMode !== 'zh' && <Text style={{ fontSize: 8, color: '#bfdbfe', marginTop: 1 }}>{ptEn('cover_qr')}</Text>}
            </View>
            <Image src={qrUrl(`https://disaster-handbook.vercel.app/?city=${encodeURIComponent(household.city)}&district=${encodeURIComponent(household.district)}`)} style={{ width: 56, height: 56 }} />
          </View>
        </View>
      </Page>

      {/* ─── PAGE 2: EMERGENCY ACTION CARD ─── */}
      <Page size="A4" style={s.actionPage}>
        <View style={s.actionBanner}>
          <Text style={s.actionBannerText}>{pt(biMode, 'action_title')}</Text>
          {biMode !== 'zh' && <Text style={[s.actionBannerText, { fontSize: 9, marginTop: 2 }]}>{ptEn('action_title')}</Text>}
          <Text style={s.actionBannerSub}>{pt(biMode, 'action_sub')}</Text>
          {biMode !== 'zh' && <Text style={[s.actionBannerSub, { fontSize: 7.5 }]}>{ptEn('action_sub')}</Text>}
        </View>

        {/* Earthquake */}
        <View style={[s.actionRow, { borderColor: '#e04545' }]}>
          <Text style={s.actionEmoji}>1</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#e04545' }]}>{pt(biMode, 'eq_title')}{biMode !== 'zh' ? ' / ' + ptEn('eq_title') : ''}</Text>
            <Text style={s.actionBody}>
              {pt(biMode, 'eq_action')}
            </Text>
            {biMode !== 'zh' && <Text style={[s.actionBody, { color: '#6b7280', fontSize: 8.5 }]}>{ptEn('eq_action')}</Text>}
          </View>
        </View>

        {/* Air Raid */}
        <View style={[s.actionRow, { borderColor: '#8b5cf6' }]}>
          <Text style={s.actionEmoji}>2</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#8b5cf6' }]}>{pt(biMode, 'air_title')}{biMode !== 'zh' ? ' / ' + ptEn('air_title') : ''}</Text>
            <Text style={s.actionBody}>
              {pt(biMode, 'air_action')}
            </Text>
            {biMode !== 'zh' && <Text style={[s.actionBody, { color: '#6b7280', fontSize: 8.5 }]}>{ptEn('air_action')}</Text>}
          </View>
        </View>

        {/* Fire */}
        <View style={[s.actionRow, { borderColor: '#d4882a' }]}>
          <Text style={s.actionEmoji}>3</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#d4882a' }]}>{pt(biMode, 'fire_title')}{biMode !== 'zh' ? ' / ' + ptEn('fire_title') : ''}</Text>
            <Text style={s.actionBody}>
              {household.housingType === 'apartment'
                ? /^[Bb]|地下/.test(household.floor)
                  ? pt(biMode, 'fire_apt_basement')
                  : `${pt(biMode, 'fire_apt_floor_pre')}${household.floor ? ` ${household.floor} ${pt(biMode, 'loc_floor_suffix')}` : pt(biMode, 'loc_floor_suffix')} ${pt(biMode, 'fire_apt_floor_post')}`
                : pt(biMode, 'fire_action_house')}
            </Text>
            {biMode !== 'zh' && (
              <Text style={[s.actionBody, { color: '#6b7280', fontSize: 8.5 }]}>
                {household.housingType === 'apartment'
                  ? /^[Bb]|地下/.test(household.floor)
                    ? ptEn('fire_apt_basement')
                    : `${ptEn('fire_apt_floor_pre')}${household.floor ? ` ${household.floor} ${ptEn('loc_floor_suffix')}` : ptEn('loc_floor_suffix')} ${ptEn('fire_apt_floor_post')}`
                  : ptEn('fire_action_house')}
              </Text>
            )}
          </View>
        </View>

        {/* Typhoon */}
        <View style={[s.actionRow, { borderColor: '#3b6fd4' }]}>
          <Text style={s.actionEmoji}>4</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#3b6fd4' }]}>{pt(biMode, 'typhoon_title')}{biMode !== 'zh' ? ' / ' + ptEn('typhoon_title') : ''}</Text>
            <Text style={s.actionBody}>
              {pt(biMode, 'typhoon_action')}
            </Text>
            {biMode !== 'zh' && <Text style={[s.actionBody, { color: '#6b7280', fontSize: 8.5 }]}>{ptEn('typhoon_action')}</Text>}
          </View>
        </View>

        {/* Infant Warning */}
        {household.hasInfant && (
          <View style={[s.warningBox, { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', marginBottom: 6 }]}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#92400e', marginBottom: 3 }}>{pt(biMode, 'infant_title')}{biMode !== 'zh' ? ' / ' + ptEn('infant_title') : ''}</Text>
            {(['infant_1', 'infant_2', 'infant_3', 'infant_4', 'infant_5'] as const).map((key, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ color: '#92400e', marginRight: 5, fontSize: 9 }}>•</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, color: '#78350f' }}>{pt(biMode, key)}</Text>
                  {biMode !== 'zh' && <Text style={{ fontSize: 7.5, color: '#92400e' }}>{ptEn(key)}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* MAIN MEETING POINT */}
        <View style={s.actionMeet}>
          <Text style={s.actionMeetLabel}>{pt(biMode, 'meeting_label')}{biMode !== 'zh' ? ' / ' + ptEn('meeting_label') : ''}</Text>
          <Text style={s.actionMeetValue}>{mainShelter?.name ?? pt(biMode, 'meeting_fallback')}</Text>
          {mainShelter?.distance && (
            <Text style={s.actionMeetDist}>
              {biMode !== 'en' ? pt(biMode, 'label_distance_from_home') + ' ' : ''}{distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}）
            </Text>
          )}
          {mainShelter?.address && <Text style={s.actionMeetDist}>{mainShelter.address}</Text>}
        </View>

        {/* Key numbers */}
        <View style={s.twoCol}>
          <View style={s.col}>
            {(['num_fire', 'num_police', 'num_air'] as const).map((key, ni) => {
              const nums = ['119', '110', '166']
              const n = nums[ni]
              return (
                <View key={n} style={s.numRow}>
                  <Text style={s.numBig}>{n}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.numLabel}>{pt(biMode, key)}</Text>
                    {biMode !== 'zh' && <Text style={{ fontSize: 8, color: '#6b7280' }}>{ptEn(key)}</Text>}
                  </View>
                </View>
              )
            })}
          </View>
          <View style={s.col}>
            {(['num_msg', 'num_mental', 'num_disaster'] as const).map((key, ni) => {
              const nums = ['1991', '1925', '0800-024-985']
              const n = nums[ni]
              return (
                <View key={n} style={s.numRow}>
                  <Text style={[s.numBig, { fontSize: n.length > 4 ? 14 : 20 }]}>{n}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.numLabel}>{pt(biMode, key)}</Text>
                    {biMode !== 'zh' && <Text style={{ fontSize: 8, color: '#6b7280' }}>{ptEn(key)}</Text>}
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        <Footer label={pt(biMode, 'action_footer')} biMode={biMode} />
      </Page>

      {/* ─── PAGE 3: FAMILY REUNION & COMMUNICATION PLAN ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#3b82f6', color: '#3b82f6' }]}>
          {pt(biMode, 'reunion_title')}
        </Text>
        {biMode !== 'zh' && <Text style={{ fontSize: 8, color: '#3b82f6', marginBottom: 2 }}>{ptEn('reunion_title')}</Text>}
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: biMode !== 'zh' ? 2 : 8 }}>
          {pt(biMode, 'reunion_desc')}
        </Text>
        {biMode !== 'zh' && <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 6 }}>{ptEn('reunion_desc')}</Text>}

        {/* Each member's location and nearest shelter */}
        <Text style={s.sectionTitle}>{pt(biMode, 'reunion_members')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('reunion_members')}</Text>}
        {allMembers.map((m, i) => {
          const addr = memberAddr(m, fullAddr)
          const loc = m.hasDifferentAddress
            ? data.locations.find(l => l.memberName === m.name)
            : mainLocation
          const nearestShelter = loc?.shelters[0]
          return (
            <View key={i} style={s.reunionBox}>
              <Text style={s.reunionName}>{m.name}</Text>
              <View style={s.reunionRow}>
                <Text style={s.reunionLabel}>{pt(biMode, 'reunion_addr')}{biMode !== 'zh' ? '/' + ptEn('reunion_addr') : ''}</Text>
                <Text style={s.reunionValue}>{addr}</Text>
              </View>
              <View style={s.reunionRow}>
                <Text style={s.reunionLabel}>{pt(biMode, 'reunion_shelter')}{biMode !== 'zh' ? '/' + ptEn('reunion_shelter') : ''}</Text>
                <Text style={[s.reunionValue, { fontWeight: 'bold' }]}>
                  {nearestShelter?.name ?? pt(biMode, 'reunion_query_office')}
                  {nearestShelter?.distance ? ` （${distText(nearestShelter.distance)}）` : ''}
                </Text>
              </View>
              {m.isMobilityImpaired && (
                <View style={s.reunionRow}>
                  <Text style={s.reunionLabel}>{pt(biMode, 'reunion_special_needs')}{biMode !== 'zh' ? '/' + ptEn('reunion_special_needs') : ''}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.reunionValue, { color: '#e04545', fontWeight: 'bold' }]}>{pt(biMode, 'reunion_mobility')}</Text>
                    {biMode !== 'zh' && <Text style={{ fontSize: 7.5, color: '#e04545' }}>{ptEn('reunion_mobility')}</Text>}
                  </View>
                </View>
              )}
              {m.medications && (
                <View style={s.reunionRow}>
                  <Text style={s.reunionLabel}>{pt(biMode, 'reunion_meds')}{biMode !== 'zh' ? '/' + ptEn('reunion_meds') : ''}</Text>
                  <Text style={s.reunionValue}>{m.medications}</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* Communication Plan */}
        <Text style={s.sectionTitle}>{pt(biMode, 'comm_title')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('comm_title')}</Text>}
        <View style={[s.tipBox]}>
          {([
            'comm_1',
            'comm_2_text',
            'comm_3',
            outOfCityContact ? 'comm_4_with_contact_pre' : 'comm_4_no_contact',
            'comm_5',
          ] as string[]).map((key, i) => {
            const zhText = i === 3
              ? outOfCityContact
                ? `${pt(biMode, 'comm_4_with_contact_pre')} ${outOfCityContact.name}（${outOfCityContact.phone}）${pt(biMode, 'comm_4_with_contact_post')}`
                : pt(biMode, 'comm_4_no_contact')
              : pt(biMode, key)
            const enText = i === 3
              ? outOfCityContact
                ? `${ptEn('comm_4_with_contact_pre')} ${outOfCityContact.name} (${outOfCityContact.phone})${ptEn('comm_4_with_contact_post')}`
                : ptEn('comm_4_no_contact')
              : ptEn(key)
            return (
              <View key={i} style={{ marginBottom: 2 }}>
                <Text style={s.tipText}>{zhText}</Text>
                {biMode !== 'zh' && <Text style={[s.tipText, { fontSize: 7.5, color: '#6b7280' }]}>{enText}</Text>}
              </View>
            )
          })}
        </View>

        {/* When phone doesn't work */}
        <Text style={s.sectionTitle}>{pt(biMode, 'nophone_title')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('nophone_title')}</Text>}
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {(['nophone_1', 'nophone_2', 'nophone_3', 'nophone_4', 'nophone_5'] as const).map((key, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9 }}>{pt(biMode, key)}</Text>
                {biMode !== 'zh' && <Text style={{ fontSize: 7.5, color: '#6b7280' }}>{ptEn(key)}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Emergency Contacts */}
        <Text style={s.sectionTitle}>{pt(biMode, 'contacts_title')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('contacts_title')}</Text>}
        {allContacts.map((c, i) => (
          <View key={i} style={s.contactCard}>
            <Text style={s.contactName}>{c.name}{pt(biMode, 'label_contact_relation_wrap')}{c.relation}{pt(biMode, 'label_contact_relation_wrap_end')}</Text>
            <Text style={s.contactPhone}>{c.phone}</Text>
            {c.phoneBackup ? <Text style={s.contactMeta}>{pt(biMode, 'reunion_contact_backup')}{biMode !== 'zh' ? '/' + ptEn('reunion_contact_backup') : ''}：{c.phoneBackup}</Text> : null}
            {c.isOutOfCity && (
              <View>
                <Text style={[s.contactMeta, { color: '#d4882a', fontWeight: 'bold' }]}>
                  {pt(biMode, 'reunion_out_of_city')}
                </Text>
                {biMode !== 'zh' && <Text style={[s.contactMeta, { color: '#d4882a', fontSize: 7.5 }]}>{ptEn('reunion_out_of_city')}</Text>}
              </View>
            )}
          </View>
        ))}

        <Footer label={pt(biMode, "reunion_title")} biMode={biMode} />
      </Page>

      {/* ─── PAGES 4+: LOCATION EVACUATION GUIDES ─── */}
      {data.locations.map((loc, i) => (
        <LocationPage key={i} loc={loc} mapImg={mapImages?.[i]} biMode={biMode} />
      ))}

      {/* ─── COMBINED: MEMBER OVERVIEW ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#3b82f6', color: '#3b82f6' }]}>
          {pt(biMode, 'member_title')}
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 6 }}>
          {pt(biMode, 'member_desc_full')}
        </Text>

        {allMembers.map((m, i) => {
          const addr = memberAddr(m, fullAddr)
          const loc = m.hasDifferentAddress
            ? data.locations.find(l => l.memberName === m.name)
            : mainLocation
          const shelter = loc?.shelters[0]
          const emergContact = outOfCityContact ?? allContacts[0]
          return (
            <View key={i} style={s.pCard}>
              <View style={s.pCardHeader}>
                <Text style={s.pCardName}>{m.name}</Text>
                <Text style={s.pCardBlood}>{pt(biMode, 'label_blood_type')} {m.bloodType}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <View style={{ flex: 1 }}>
                  <View style={s.pCardRow}>
                    <Text style={s.pCardLabel}>{pt(biMode, 'label_addr')}</Text>
                    <Text style={s.pCardValue}>{addr}</Text>
                  </View>
                  <View style={s.pCardRow}>
                    <Text style={s.pCardLabel}>{pt(biMode, 'label_meeting_point')}</Text>
                    <Text style={[s.pCardValue, { fontWeight: 'bold' }]}>{shelter?.name ?? '—'}{shelter?.distance ? `（${distText(shelter.distance)}）` : ''}</Text>
                  </View>
                  {m.birthYear ? (
                    <View style={s.pCardRow}>
                      <Text style={s.pCardLabel}>{pt(biMode, 'label_age')}</Text>
                      <Text style={s.pCardValue}>{m.birthYear} {pt(biMode, 'label_born')}（{new Date().getFullYear() - Number(m.birthYear)} {pt(biMode, 'label_years_old')}）</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  {m.medications ? (
                    <View style={s.pCardRow}>
                      <Text style={s.pCardLabel}>{pt(biMode, 'label_medication')}</Text>
                      <Text style={[s.pCardValue, { fontWeight: 'bold', color: '#e04545' }]}>{m.medications}</Text>
                    </View>
                  ) : null}
                  {m.allergies ? (
                    <View style={s.pCardRow}>
                      <Text style={s.pCardLabel}>{pt(biMode, 'label_allergy')}</Text>
                      <Text style={[s.pCardValue, { fontWeight: 'bold', color: '#e04545' }]}>{m.allergies}</Text>
                    </View>
                  ) : null}
                  {m.hasChronic ? (
                    <View style={s.pCardRow}>
                      <Text style={s.pCardLabel}>{pt(biMode, 'label_chronic')}</Text>
                      <Text style={[s.pCardValue, { color: '#e04545' }]}>{pt(biMode, 'label_has_yes')}</Text>
                    </View>
                  ) : null}
                  {m.isMobilityImpaired ? (
                    <View style={s.pCardRow}>
                      <Text style={s.pCardLabel}>{pt(biMode, 'label_mobility')}</Text>
                      <Text style={[s.pCardValue, { color: '#e04545' }]}>{pt(biMode, 'label_mobility_impaired')}</Text>
                    </View>
                  ) : null}
                  {m.specialNeeds ? (
                    <View style={s.pCardRow}>
                      <Text style={s.pCardLabel}>{pt(biMode, 'label_needs')}</Text>
                      <Text style={s.pCardValue}>{m.specialNeeds}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 3, paddingTop: 3 }}>
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>{pt(biMode, 'label_emergency_contact')}</Text>
                  <Text style={[s.pCardValue, { fontWeight: 'bold' }]}>{emergContact ? `${emergContact.name} ${emergContact.phone}` : '＿＿＿＿＿＿'}</Text>
                </View>
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>{pt(biMode, 'label_emergency_phone')}</Text>
                  <Text style={s.pCardValue}>{pt(biMode, 'member_emerg_numbers')}</Text>
                </View>
              </View>
            </View>
          )
        })}

        {mainHospital && (
          <View style={[s.tipBox, { marginTop: 4 }]}>
            <Text style={s.tipText}>
              {pt(biMode, 'label_nearest_medical')}：{mainHospital.name}
              {mainHospital.hasER ? pt(biMode, 'label_has_er_paren') : ''}
              {mainHospital.distance ? `　${distText(mainHospital.distance)}` : ''}
              {mainHospital.phone ? `　${mainHospital.phone}` : ''}
            </Text>
          </View>
        )}
        <Footer label={pt(biMode, 'member_footer')} biMode={biMode} />
      </Page>

      {/* ─── FOREIGN NATIONAL INFO ─── */}
      {household.isForeignNational && (() => {
        const res = FOREIGN_RESOURCES.find(r => r.nationality === household.nationality)
        return (
          <Page size="A4" style={s.page}>
            <Text style={[s.scenarioTitle, { borderBottomColor: '#0ea5e9', color: '#0ea5e9' }]}>
              {pt(biMode, 'foreign_title')} Information for Foreign Nationals
            </Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>
              {pt(biMode, 'foreign_shelter_open')}
            </Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>
              {ptEn('foreign_shelter_open')}
            </Text>

            <Text style={s.sectionTitle}>{pt(biMode, 'foreign_hotlines')} Multilingual Hotlines</Text>
            {FOREIGN_HOTLINES.map((h, i) => (
              <View key={i} style={s.numRow}>
                <Text style={[s.numBig, { fontSize: h.number.length > 4 ? 14 : 20 }]}>{h.number}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.numLabel, { fontWeight: 'bold' }]}>{h.name}</Text>
                  <Text style={{ fontSize: 8, color: '#6b7280' }}>{h.nameEn}　{h.note}</Text>
                </View>
              </View>
            ))}

            {res && (<>
              <Text style={s.sectionTitle}>{pt(biMode, 'foreign_embassy_pre')} Representative Office ({res.nameNative})</Text>
              <View style={s.contactCard}>
                <Text style={s.contactName}>{res.embassy}</Text>
                <Text style={s.contactPhone}>{res.embassyPhone}</Text>
                <Text style={[s.contactMeta, { marginTop: 2 }]}>{res.embassyAddress}</Text>
                {res.emergencyPhone && (
                  <Text style={[s.contactMeta, { color: '#e04545', fontWeight: 'bold', marginTop: 2 }]}>
                    {pt(biMode, 'foreign_emergency')} Emergency: {res.emergencyPhone}
                  </Text>
                )}
              </View>
            </>)}

            {(household.employerName || household.brokerName) && (
              <>
                <Text style={s.sectionTitle}>{pt(biMode, 'foreign_employer')} Employer / Broker</Text>
                {household.employerName && (
                  <View style={s.contactCard}>
                    <Text style={s.contactName}>{pt(biMode, 'foreign_employer_label')} Employer：{household.employerName}</Text>
                    {household.employerPhone && <Text style={s.contactPhone}>{household.employerPhone}</Text>}
                  </View>
                )}
                {household.brokerName && (
                  <View style={s.contactCard}>
                    <Text style={s.contactName}>{pt(biMode, 'foreign_broker_label')} Broker：{household.brokerName}</Text>
                    {household.brokerPhone && <Text style={s.contactPhone}>{household.brokerPhone}</Text>}
                  </View>
                )}
              </>
            )}

            <Text style={s.sectionTitle}>{pt(biMode, 'foreign_reminders')} Important Reminders</Text>
            <View style={[s.warningBox, { backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd' }]}>
              {[
                pt(biMode, 'foreign_tip_1'),
                ptEn('foreign_tip_1'),
                pt(biMode, 'foreign_tip_2'),
                ptEn('foreign_tip_2'),
                pt(biMode, 'foreign_tip_3'),
                ptEn('foreign_tip_3'),
                pt(biMode, 'foreign_tip_4'),
                ptEn('foreign_tip_4'),
              ].map((t, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={{ color: '#0369a1', marginRight: 5, fontSize: 9 }}>{i % 2 === 0 ? '▶' : '　'}</Text>
                  <Text style={{ flex: 1, fontSize: i % 2 === 0 ? 9 : 8, color: i % 2 === 0 ? '#1e293b' : '#64748b' }}>{t}</Text>
                </View>
              ))}
            </View>

            <Footer label="Foreign Nationals Info" biMode={biMode} />
          </Page>
        )
      })()}

      {/* ─── 72-HOUR SUPPLY CHECKLIST ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#16a34a', color: '#15803d' }]}>
          {pt(biMode, 'supply_title')}
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
          {pt(biMode, 'supply_desc')}
        </Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.checkCat}>{pt(biMode, 'supply_food')}（{allMembers.length} {pt(biMode, 'supply_food_count')}）</Text>
            {([
              `${pt(biMode, 'chk_water_dynamic_pre')} ${allMembers.length * 6} ${pt(biMode, 'chk_water_dynamic_unit')}`,
              pt(biMode, 'chk_food_instant'),
              pt(biMode, 'chk_food_rice'),
              household.hasInfant ? `${pt(biMode, 'chk_infant_formula_pre')}${household.infantInfo || pt(biMode, 'infant_title').split(' —')[0]}${pt(biMode, 'chk_infant_formula_post')}` : pt(biMode, 'chk_infant_formula_default'),
              household.hasInfant ? pt(biMode, 'chk_infant_baby_food') : null,
              pt(biMode, 'chk_utensils'),
              household.hasPets ? `${pt(biMode, 'chk_pet_supply_pre')}${household.petInfo || pt(biMode, 'chk_pet_supply_default')}${pt(biMode, 'chk_pet_supply_post')}` : null,
            ] as (string|null)[]).filter(Boolean).map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>{pt(biMode, 'supply_medical')}</Text>
            {([
              pt(biMode, 'chk_firstaid'),
              pt(biMode, 'chk_painkillers'),
              ...allMembers.filter(m => m.medications).map(m => `${m.name}${pt(biMode, 'chk_meds_pre')}${m.medications}${pt(biMode, 'chk_meds_post')}`),
              ...allMembers.filter(m => m.allergies).map(m => `${pt(biMode, 'chk_allergy_pre')}${m.name}${pt(biMode, 'chk_allergy_mid')}${m.allergies}）`),
              pt(biMode, 'chk_thermometer'),
              pt(biMode, 'chk_masks'),
              pt(biMode, 'chk_saline'),
              allMembers.some(m => m.isMobilityImpaired) ? pt(biMode, 'chk_wheelchair') : null,
            ] as (string|null)[]).filter(Boolean).map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>{pt(biMode, 'supply_hygiene')}</Text>
            {([
              pt(biMode, 'chk_wipes'),
              pt(biMode, 'chk_bags'),
              pt(biMode, 'chk_hygiene'),
              household.hasInfant ? pt(biMode, 'chk_infant_diapers') : null,
              household.hasInfant ? pt(biMode, 'chk_infant_wipes') : null,
              household.hasInfant ? pt(biMode, 'chk_infant_bottles') : null,
              household.hasInfant ? pt(biMode, 'chk_infant_carrier') : null,
              household.hasInfant ? pt(biMode, 'chk_infant_pacifier') : null,
              !household.hasInfant ? pt(biMode, 'chk_diapers_optional') : null,
            ] as (string|null)[]).filter(Boolean).map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={s.col}>
            <Text style={s.checkCat}>{pt(biMode, 'supply_comm')}</Text>
            {[
              pt(biMode, 'chk_radio'),
              pt(biMode, 'chk_flashlight'),
              pt(biMode, 'chk_powerbank'),
              pt(biMode, 'chk_whistle'),
              pt(biMode, 'chk_glowstick'),
            ].map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>{pt(biMode, 'supply_docs')}</Text>
            {[
              pt(biMode, 'chk_id'),
              pt(biMode, 'chk_bank'),
              pt(biMode, 'chk_handbook'),
              pt(biMode, 'chk_cash'),
              pt(biMode, 'chk_waterproof'),
            ].map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>{pt(biMode, 'supply_clothes')}</Text>
            {([
              `${pt(biMode, 'chk_raincoat')} ${allMembers.length} ${pt(biMode, 'chk_raincoat_unit')}`,
              pt(biMode, 'chk_clothes'),
              pt(biMode, 'chk_jacket'),
              pt(biMode, 'chk_gloves'),
              pt(biMode, 'chk_knife'),
              pt(biMode, 'chk_rope'),
              pt(biMode, 'chk_fire'),
              household.hasPets ? pt(biMode, 'chk_pet_carrier') : null,
            ] as (string|null)[]).filter(Boolean).map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[s.tipBox, { marginTop: 4 }]}>
          <Text style={s.tipText}>
            {pt(biMode, 'supply_tip')}
          </Text>
        </View>
        <Footer label={pt(biMode, "supply_title")} biMode={biMode} />
      </Page>

      {/* ─── SCENARIO: EARTHQUAKE ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#e04545', color: '#e04545' }]}>
          {pt(biMode, 'eq_full_title')}
        </Text>

        <Text style={[s.sectionTitle, { color: '#e04545', borderBottomColor: '#fecaca' }]}>{pt(biMode, 'eq_at_home')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('eq_at_home')}</Text>}
        {[
          pt(biMode, 'eq_home_1'),
          pt(biMode, 'eq_home_2'),
          pt(biMode, 'eq_home_3'),
          pt(biMode, 'eq_home_4'),
          household.housingType === 'apartment'
            ? /^[Bb]|地下/.test(household.floor)
              ? pt(biMode, 'eq_basement_up')
              : `${pt(biMode, 'eq_floor_down_pre')} ${household.floor || '?'} ${pt(biMode, 'eq_floor_down_post')}`
            : pt(biMode, 'eq_house_check'),
          `${pt(biMode, 'eq_go_meeting_pre')}${mainShelter?.name ?? pt(biMode, 'eq_go_meeting_fallback')}`,
          pt(biMode, 'eq_headcount'),
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#e04545' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#e04545', borderBottomColor: '#fecaca' }]}>{pt(biMode, 'eq_outdoor')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('eq_outdoor')}</Text>}
        {[
          pt(biMode, 'eq_out_1'),
          pt(biMode, 'eq_out_2'),
          pt(biMode, 'eq_out_3'),
          pt(biMode, 'eq_out_4'),
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#e04545' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#e04545', borderBottomColor: '#fecaca' }]}>{pt(biMode, 'eq_after')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('eq_after')}</Text>}
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {[
            pt(biMode, 'eq_after_1'),
            pt(biMode, 'eq_after_2'),
            pt(biMode, 'eq_after_3'),
            pt(biMode, 'eq_after_4'),
            pt(biMode, 'eq_after_5'),
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>{t}</Text>
            </View>
          ))}
        </View>
        <Footer label={pt(biMode, "eq_full_title")} biMode={biMode} />
      </Page>

      {/* ─── SCENARIO: AIR RAID + FIRE ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#8b5cf6', color: '#8b5cf6' }]}>
          {pt(biMode, 'air_full_title')}
        </Text>
        <View style={[s.warningBox, { backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#d8b4fe', marginBottom: 6 }]}>
          <Text style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 'bold' }}>
            {pt(biMode, 'air_sound')}
          </Text>
        </View>

        <Text style={[s.sectionTitle, { color: '#8b5cf6', borderBottomColor: '#d8b4fe' }]}>{pt(biMode, 'air_after')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('air_after')}</Text>}
        {[
          pt(biMode, 'air_1'),
          pt(biMode, 'air_2'),
          pt(biMode, 'air_3'),
          pt(biMode, 'air_4'),
          pt(biMode, 'air_5'),
          pt(biMode, 'air_6'),
          pt(biMode, 'air_7'),
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#8b5cf6' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}
        <View style={[s.tipBox, { borderColor: '#d8b4fe' }]}>
          <Text style={[s.tipText, { color: '#8b5cf6' }]}>
            {pt(biMode, 'air_tip')}
          </Text>
        </View>

        <Text style={[s.scenarioTitle, { borderBottomColor: '#d4882a', color: '#d4882a', marginTop: 12 }]}>
          {pt(biMode, 'fire_full_title')}
        </Text>
        <Text style={[s.sectionTitle, { color: '#d4882a', borderBottomColor: '#fed7aa' }]}>{pt(biMode, 'fire_when')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('fire_when')}</Text>}
        {([
          pt(biMode, 'fire_1'),
          household.housingType === 'apartment'
            ? pt(biMode, 'fire_2_apt')
            : pt(biMode, 'fire_2_house'),
          pt(biMode, 'fire_3'),
          pt(biMode, 'fire_4'),
          `${pt(biMode, 'fire_5_pre')}${fullAddr}${pt(biMode, 'fire_5_post')}`,
          pt(biMode, 'fire_6'),
          `${pt(biMode, 'fire_7_pre')} ${mainShelter?.name ?? pt(biMode, 'loc_fallback_plaza')}${pt(biMode, 'fire_7_post')}`,
        ] as string[]).map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#d4882a' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}
        <Footer label={pt(biMode, 'airfire_footer')} biMode={biMode} />
      </Page>

      {/* ─── SCENARIO: TYPHOON + FLOOD ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#3b6fd4', color: '#3b6fd4' }]}>
          {pt(biMode, 'typhoon_full_title')}
        </Text>

        <Text style={[s.sectionTitle, { color: '#3b6fd4', borderBottomColor: '#bfdbfe' }]}>{pt(biMode, 'typhoon_before')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('typhoon_before')}</Text>}
        {[
          pt(biMode, 'ty_before_1'),
          pt(biMode, 'ty_before_2'),
          pt(biMode, 'ty_before_3'),
          pt(biMode, 'ty_before_4'),
          pt(biMode, 'ty_before_5'),
          pt(biMode, 'ty_before_6'),
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#3b6fd4' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#3b6fd4', borderBottomColor: '#bfdbfe' }]}>{pt(biMode, 'typhoon_during')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('typhoon_during')}</Text>}
        {[
          pt(biMode, 'ty_during_1'),
          pt(biMode, 'ty_during_2'),
          pt(biMode, 'ty_during_3'),
          pt(biMode, 'ty_during_4'),
          pt(biMode, 'ty_during_5'),
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#3b6fd4' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#3b6fd4', borderBottomColor: '#bfdbfe' }]}>{pt(biMode, 'typhoon_after')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('typhoon_after')}</Text>}
        <View style={[s.warningBox, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
          {[
            pt(biMode, 'ty_after_1'),
            pt(biMode, 'ty_after_2'),
            pt(biMode, 'ty_after_3'),
            pt(biMode, 'ty_after_4'),
            pt(biMode, 'ty_after_5'),
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#3b6fd4', marginRight: 5, fontSize: 9 }}>•</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>{t}</Text>
            </View>
          ))}
        </View>

        <Footer label={pt(biMode, "typhoon_full_title")} biMode={biMode} />
      </Page>

      {/* ─── IMPORTANT REMINDERS ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#374151', color: '#374151' }]}>
          {pt(biMode, 'remind_title')}
        </Text>

        <Text style={s.sectionTitle}>{pt(biMode, 'remind_equip')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('remind_equip')}</Text>}
        {[
          `${pt(biMode, 'rem_gas')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_power')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_water')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_extinguisher')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_exit')}：＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_manager')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
        ].map((t, i) => (
          <Text key={i} style={{ fontSize: 10, marginBottom: 6 }}>{t}</Text>
        ))}

        <Text style={s.sectionTitle}>{pt(biMode, 'remind_check')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('remind_check')}</Text>}
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>{pt(biMode, 'remind_check_desc')}</Text>
        {[
          pt(biMode, 'remind_chk_1'),
          pt(biMode, 'remind_chk_2'),
          pt(biMode, 'remind_chk_3'),
          pt(biMode, 'remind_chk_4'),
          pt(biMode, 'remind_chk_5'),
          pt(biMode, 'remind_chk_6'),
          pt(biMode, 'remind_chk_7'),
          pt(biMode, 'remind_chk_8'),
          pt(biMode, 'remind_chk_9'),
          pt(biMode, 'remind_chk_10'),
        ].map((item, i) => (
          <View key={i} style={s.checkItem}>
            <View style={s.checkbox} />
            <Text style={s.checkText}>{item}</Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>{pt(biMode, 'remind_memo')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('remind_memo')}</Text>}
        {[
          `${pt(biMode, 'rem_doctor')}：＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_insurance')}：＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_plate')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_pet_chip')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, 'rem_other')}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
        ].map((t, i) => (
          <Text key={i} style={{ fontSize: 10, marginBottom: 6 }}>{t}</Text>
        ))}

        <View style={[s.tipBox, { marginTop: 8 }]}>
          <Text style={s.tipText}>
            {pt(biMode, 'remind_final')}
          </Text>
        </View>

        <Footer label={pt(biMode, "remind_title")} biMode={biMode} />
      </Page>

    </Document>
  )
}
