import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import type { HandbookData, LocationInfo, Shelter, MedicalFacility, Member } from '@/types'
import { FOREIGN_RESOURCES, FOREIGN_HOTLINES } from '@/lib/foreign-resources'
import { pt, ptEn, type BiMode } from '@/lib/pdf-i18n'

// Fonts served from jsDelivr CDN (free, unlimited bandwidth)
const CDN_FONTS = 'https://cdn.jsdelivr.net/gh/siriushsu/taiwan-disaster-handbook@main/public/fonts'
Font.register({
  family: 'NotoSansTC',
  fonts: [
    { src: `${CDN_FONTS}/NotoSansTC-Regular-subset.ttf`, fontWeight: 'normal' },
    { src: `${CDN_FONTS}/NotoSansTC-Bold-subset.ttf`, fontWeight: 'bold' },
  ],
})

/* ── helpers ───────────────────────────────────────── */
let _lang: BiMode = 'zh'
function distText(m?: number) {
  if (!m) return ''
  if (_lang === 'en') return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
  return m < 1000 ? `${m} 公尺` : `${(m / 1000).toFixed(1)} 公里`
}
function walkMin(m?: number) {
  if (!m) return ''
  const mins = Math.ceil(m / 80)
  if (_lang === 'en') return mins <= 1 ? '~1 min walk' : `~${mins} min walk`
  return mins <= 1 ? '步行約 1 分鐘' : `步行約 ${mins} 分鐘`
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
    <Text style={s.footerText}>{biMode === 'en' ? 'Taiwan Family Emergency Handbook' : '家庭防災手冊'}</Text>
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

function DirMap({ loc, mapImg, biMode = 'zh' }: { loc: LocationInfo; mapImg?: string; biMode?: BiMode }) {
  if (!loc.geo) return null

  // If we have a captured map image, show it
  if (mapImg) {
    return (
      <View style={{ marginBottom: 8 }}>
        <Image src={mapImg} style={{ width: '100%', height: 160, borderRadius: 4, objectFit: 'cover' }} />
        <View style={{ flexDirection: 'row', marginTop: 3 }}>
          <Text style={{ fontSize: 7, color: '#6b7280' }}>● {_lang === 'en' ? '● Red=Home ● Blue=Shelter ● Purple=Air Raid ● Green=Medical' : '● 紅=住家　● 藍=避難所　● 紫=防空　● 綠=醫療'}</Text>
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
    if (sh.lat && sh.lng) items.push({ name: sh.name, dir: bearing(loc.geo.lat, loc.geo.lng, sh.lat, sh.lng), dist: distText(sh.distance), color: '#3b82f6', tag: _lang === 'en' ? 'Shelter' : '避難所' })
  }
  for (const sh of airRaid) {
    if (sh.lat && sh.lng) items.push({ name: sh.address || sh.name, dir: bearing(loc.geo.lat, loc.geo.lng, sh.lat, sh.lng), dist: distText(sh.distance), color: '#8b5cf6', tag: _lang === 'en' ? 'Air Raid' : '防空' })
  }
  for (const m of medical) {
    if (m.lat && m.lng) items.push({ name: m.name, dir: bearing(loc.geo.lat, loc.geo.lng, m.lat, m.lng), dist: distText(m.distance), color: '#059669', tag: m.hasER ? (_lang === 'en' ? 'ER' : '急診') : (_lang === 'en' ? 'Medical' : '醫療') })
  }
  if (items.length === 0) return null
  return (
    <View style={{ backgroundColor: '#f8fafc', borderRadius: 6, padding: '8 12', marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>方位速查（從住家出發）</Text>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {items.filter((_, i) => i % 2 === 0).map((item, i) => <DirItem key={i} item={item} />)}
        </View>
        <View style={{ flex: 1 }}>
          {items.filter((_, i) => i % 2 === 1).map((item, i) => <DirItem key={i} item={item} />)}
        </View>
      </View>
      <Text style={{ fontSize: 6.5, color: '#9ca3af', marginTop: 3 }}>{_lang === 'en' ? 'Blue=Shelter Purple=Air Raid Green=Medical' : '藍=避難所　紫=防空　綠=醫療'}</Text>
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
        <Text style={s.locTitle}>{loc.label}　完整避難指南</Text>
        <Text style={s.locAddr}>{loc.address}</Text>
        {loc.housingType === 'apartment' && loc.floor
          ? <Text style={s.locAddr}>公寓大樓 {loc.floor} 樓</Text>
          : null}
      </View>

      <DirMap loc={loc} mapImg={mapImg} biMode={biMode} />

      {/* Meeting Points */}
      <Text style={s.sectionTitle}>{pt(biMode, 'loc_meeting')}</Text>
      {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_meeting')}</Text>}
      <Text style={{ fontSize: 8.5, color: '#6b7280', marginBottom: 4 }}>
        {pt(biMode, 'loc_meeting_desc')}
      </Text>
      <View style={s.meetBox}>
        <View style={[s.meetCard, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
          <Text style={[s.meetLabel, { color: '#3b82f6' }]}>{pt(biMode, 'loc_primary')}</Text>
          <Text style={s.meetValue}>{mainShelter?.name ?? '最近的公園或廣場'}</Text>
          {mainShelter?.address ? <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{mainShelter.address}</Text> : null}
          {mainShelter?.distance ? <Text style={{ fontSize: 8, color: '#059669', marginTop: 1 }}>{distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}）</Text> : null}
        </View>
        <View style={[s.meetCard, { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' }]}>
          <Text style={[s.meetLabel, { color: '#c2410c' }]}>{pt(biMode, 'loc_backup')}</Text>
          <Text style={s.meetValue}>{backupShelter?.name ?? '里辦公室或區公所'}</Text>
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
              {sh.capacity ? (_lang === 'en' ? ` Cap. ${sh.capacity.toLocaleString()}` : `　可容納 ${sh.capacity.toLocaleString()} 人`) : ''}
              {sh.indoor ? (_lang === 'en' ? ' Indoor' : '　室內') : ''}
            </Text>
            {sh.disasterTypes ? <Text style={s.shelterAddr}>適用災害：{sh.disasterTypes}</Text> : null}
            {sh.phone ? <Text style={s.shelterAddr}>管理電話：{sh.phone}</Text> : null}
            {sh.vulnerableFriendly ? <Text style={{ fontSize: 7.5, color: '#059669', marginTop: 1 }}>適合避難弱者（長者、身障者）安置</Text> : null}
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
                {m.type === 'hospital' ? '醫院' : '診所'}
                {m.hasER ? '（有急診）' : ''}
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
            isBasement
              ? `您住地下 ${loc.floor} 樓。地震後立刻往地上樓層移動，走安全梯，絕對不搭電梯`
              : `您住 ${loc.floor || '?'} 樓。地震後走安全梯下樓，絕對不搭電梯`,
            isBasement
              ? '地下室在水災時最危險！聽到豪雨警報或看到積水，立刻撤離到地上樓層'
              : '開門前先用手背感覺門溫。門燙＝外面有火，留在室內等救援',
            '低姿勢沿牆移動，用濕毛巾掩住口鼻避免吸入濃煙',
            '到達 1 樓後立刻離開建築物，不要在門口停留',
            `直接前往集合點：${mainShelter?.name ?? '最近廣場'}`,
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>▶</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>{t}</Text>
            </View>
          ))}
        </View>
      </>)}

      {loc.housingType === 'house' && (<>
        <Text style={s.sectionTitle}>{pt(biMode, 'loc_house_title')}</Text>
        {biMode !== 'zh' && <Text style={{fontSize:7.5,color:'#6b7280'}}>{ptEn('loc_house_title')}</Text>}
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {[
            '地震時躲在堅固桌子下或承重牆旁。搖晃停止後再移動',
            '確認瓦斯已關閉、電源總開關已切斷',
            '從最近的出口離開建物，注意頭上掉落物',
            `帶著緊急背包，前往集合點：${mainShelter?.name ?? '最近廣場'}`,
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>▶</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>{t}</Text>
            </View>
          ))}
        </View>
      </>)}

      <Footer label={`${loc.label} ${biMode === "en" ? "Evacuation Guide" : "避難指南"}`} biMode={biMode} />
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
  if (deg < 22.5 || deg >= 337.5) return '北'
  if (deg < 67.5) return '東北'
  if (deg < 112.5) return '東'
  if (deg < 157.5) return '東南'
  if (deg < 202.5) return '南'
  if (deg < 247.5) return '西南'
  if (deg < 292.5) return '西'
  return '西北'
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
      dist: distText(s.distance), color: '#3b82f6', tag: _lang === 'en' ? 'Shelter' : '避難所'
    })
  })
  air.forEach(s => {
    if (s.lat && s.lng) items.push({
      name: s.address || s.name, dir: bearing(loc.geo!.lat, loc.geo!.lng, s.lat, s.lng),
      dist: distText(s.distance), color: '#8b5cf6', tag: _lang === 'en' ? 'Air Raid' : '防空'
    })
  })
  med.forEach(m => {
    if (m.lat && m.lng) items.push({
      name: m.name, dir: bearing(loc.geo!.lat, loc.geo!.lng, m.lat, m.lng),
      dist: distText(m.distance), color: '#059669', tag: m.hasER ? (_lang === 'en' ? 'ER' : '急診') : (_lang === 'en' ? 'Medical' : '醫療')
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
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#374151', marginBottom: 5 }}>方位速查（從住家出發）</Text>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {left.map((item, i) => renderItem(item, i))}
        </View>
        <View style={{ flex: 1 }}>
          {right.map((item, i) => renderItem(item, i))}
        </View>
      </View>
      <Text style={{ fontSize: 6.5, color: '#9ca3af', marginTop: 3 }}>{_lang === 'en' ? 'Blue=Shelter Purple=Air Raid Green=Medical' : '藍=避難所　紫=防空　綠=醫療'}　方位為從住家出發的方向</Text>
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

export default function HandbookPDF({ data, mapImages, biMode = 'zh' }: { data: HandbookData; mapImages?: Record<number, string>; biMode?: BiMode }) {
  _lang = biMode
  const { household } = data
  const allMembers = household.members.filter(m => m.name)
  const allContacts = household.contacts.filter(c => c.name && c.phone)
  const outOfCityContact = allContacts.find(c => c.isOutOfCity)
  const mainLocation = data.locations[0]
  const mainShelter = mainLocation?.shelters[0]
  const mainHospital = mainLocation?.medical?.find((m: MedicalFacility) => m.type === 'hospital') ?? mainLocation?.medical?.[0]
  const fullAddr = `${household.city}${household.district}${household.address}`

  return (
    <Document title={`防災手冊 - ${allMembers[0]?.name ?? '家庭'}`} language="zh-TW">

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
              <Text style={s.coverBoxLabel}>外縣市聯絡人（失聯時打這支）</Text>
              <Text style={s.coverBoxValue}>{outOfCityContact.name}　{outOfCityContact.phone}</Text>
            </View>
          )}
          <View style={[s.coverBox, { marginTop: 12 }]}>
            <Text style={s.coverBoxLabel}>{pt(biMode, 'cover_date')}{biMode === 'bi' ? ' / Created' : ''}</Text>
            <Text style={{ color: '#ffffff', fontSize: 11 }}>{data.generatedAt}　建議每年更新</Text>
          </View>
        </View>
        <View style={s.coverFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text>{biMode === 'en' ? 'Print and keep visible at home (fridge or entrance).' : '列印後放在家中顯眼位置（冰箱旁或玄關）。'}</Text>
              <Text style={{ marginTop: 3 }}>{biMode === 'en' ? 'Scan QR Code to regenerate or share.' : '掃描 QR Code 可重新產生或分享給家人。'}</Text>
            </View>
            <Image src={qrUrl(`https://disaster-handbook.vercel.app/?city=${encodeURIComponent(household.city)}&district=${encodeURIComponent(household.district)}`)} style={{ width: 56, height: 56 }} />
          </View>
        </View>
      </Page>

      {/* ─── PAGE 2: EMERGENCY ACTION CARD ─── */}
      <Page size="A4" style={s.actionPage}>
        <View style={s.actionBanner}>
          <Text style={s.actionBannerText}>{pt(biMode, 'action_title')}</Text>
          <Text style={s.actionBannerSub}>{pt(biMode, 'action_sub')}</Text>
        </View>

        {/* Earthquake */}
        <View style={[s.actionRow, { borderColor: '#e04545' }]}>
          <Text style={s.actionEmoji}>1</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#e04545' }]}>{pt(biMode, 'eq_title')}</Text>
            <Text style={s.actionBody}>
              {pt(biMode, 'eq_action')}
            </Text>
          </View>
        </View>

        {/* Air Raid */}
        <View style={[s.actionRow, { borderColor: '#8b5cf6' }]}>
          <Text style={s.actionEmoji}>2</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#8b5cf6' }]}>防空警報（連續長音 90 秒）</Text>
            <Text style={s.actionBody}>
              立刻進入地下室、地下停車場、捷運站 → 遠離窗戶 → 聽廣播等「解除警報」（短音 30 秒）→ 聽到解除前不要出來
            </Text>
          </View>
        </View>

        {/* Fire */}
        <View style={[s.actionRow, { borderColor: '#d4882a' }]}>
          <Text style={s.actionEmoji}>3</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#d4882a' }]}>{pt(biMode, 'fire_title')}</Text>
            <Text style={s.actionBody}>
              {household.housingType === 'apartment'
                ? /^[Bb]|地下/.test(household.floor)
                  ? '低姿勢爬行 → 摸門把不燙才開門 → 走安全梯往地上樓層移動 → 打 119'
                  : `低姿勢爬行 → 摸門把不燙才開門 → 走安全梯下${household.floor ? ` ${household.floor} 樓` : '樓'} → 打 119`
                : '蹲低移動 → 從最近出口離開 → 不要回頭拿東西 → 打 119'}
            </Text>
          </View>
        </View>

        {/* Typhoon */}
        <View style={[s.actionRow, { borderColor: '#3b6fd4' }]}>
          <Text style={s.actionEmoji}>4</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#3b6fd4' }]}>颱風 / 水災</Text>
            <Text style={s.actionBody}>
              {pt(biMode, 'typhoon_action')}
            </Text>
          </View>
        </View>

        {/* Infant Warning */}
        {household.hasInfant && (
          <View style={[s.warningBox, { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', marginBottom: 6 }]}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#92400e', marginBottom: 3 }}>家中有嬰幼兒 — 特別注意</Text>
            {[
              pt(biMode, 'infant_1'),
              pt(biMode, 'infant_2'),
              pt(biMode, 'infant_3'),
              pt(biMode, 'infant_4'),
              pt(biMode, 'infant_5'),
            ].map((t, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ color: '#92400e', marginRight: 5, fontSize: 9 }}>▶</Text>
                <Text style={{ flex: 1, fontSize: 9, color: '#78350f' }}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* MAIN MEETING POINT */}
        <View style={s.actionMeet}>
          <Text style={s.actionMeetLabel}>{pt(biMode, 'meeting_label')}</Text>
          <Text style={s.actionMeetValue}>{mainShelter?.name ?? '最近公園或廣場'}</Text>
          {mainShelter?.distance && (
            <Text style={s.actionMeetDist}>
              {biMode === 'en' ? '' : '距離住家 '}{distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}）
            </Text>
          )}
          {mainShelter?.address && <Text style={s.actionMeetDist}>{mainShelter.address}</Text>}
        </View>

        {/* Key numbers */}
        <View style={s.twoCol}>
          <View style={s.col}>
            {([
              ['119', pt(biMode, 'num_fire')],
              ['110', pt(biMode, 'num_police')],
              ['166', pt(biMode, 'num_air')],
            ] as [string, string][]).map(([n, l]) => (
              <View key={n} style={s.numRow}>
                <Text style={s.numBig}>{n}</Text>
                <Text style={s.numLabel}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            {([
              ['1991', pt(biMode, 'num_msg')],
              ['1925', pt(biMode, 'num_mental')],
              ['0800-024-985', pt(biMode, 'num_disaster')],
            ] as [string, string][]).map(([n, l]) => (
              <View key={n} style={s.numRow}>
                <Text style={[s.numBig, { fontSize: n.length > 4 ? 14 : 20 }]}>{n}</Text>
                <Text style={s.numLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer label={biMode === "en" ? "Emergency Action Card (stick on fridge)" : "緊急行動卡（請貼冰箱）"} biMode={biMode} />
      </Page>

      {/* ─── PAGE 3: FAMILY REUNION & COMMUNICATION PLAN ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#3b82f6', color: '#3b82f6' }]}>
          {pt(biMode, 'reunion_title')}
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>
          {pt(biMode, 'reunion_desc')}
        </Text>

        {/* Each member's location and nearest shelter */}
        <Text style={s.sectionTitle}>每位家人的位置與避難資訊</Text>
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
                <Text style={s.reunionLabel}>住址</Text>
                <Text style={s.reunionValue}>{addr}</Text>
              </View>
              <View style={s.reunionRow}>
                <Text style={s.reunionLabel}>最近避難所</Text>
                <Text style={[s.reunionValue, { fontWeight: 'bold' }]}>
                  {nearestShelter?.name ?? '請查詢里辦公室'}
                  {nearestShelter?.distance ? ` （${distText(nearestShelter.distance)}）` : ''}
                </Text>
              </View>
              {m.isMobilityImpaired && (
                <View style={s.reunionRow}>
                  <Text style={s.reunionLabel}>特殊需求</Text>
                  <Text style={[s.reunionValue, { color: '#e04545', fontWeight: 'bold' }]}>行動不便，需要協助撤離</Text>
                </View>
              )}
              {m.medications && (
                <View style={s.reunionRow}>
                  <Text style={s.reunionLabel}>必帶藥物</Text>
                  <Text style={s.reunionValue}>{m.medications}</Text>
                </View>
              )}
            </View>
          )
        })}

        {/* Communication Plan */}
        <Text style={s.sectionTitle}>通訊順序（手機能通時）</Text>
        <View style={[s.tipBox]}>
          {[
            pt(biMode, 'comm_1'),
            '2. 發一則簡訊或 LINE 給家庭群組：「我在 [地點]，[安全/受傷]」',
            pt(biMode, 'comm_3'),
            outOfCityContact
              ? `4. 若聯繫不上家人，打給外縣市聯絡人 ${outOfCityContact.name}（${outOfCityContact.phone}），請他統一回報`
              : '4. 若聯繫不上家人，前往約定集合點等候',
            pt(biMode, 'comm_5'),
          ].map((t, i) => (
            <Text key={i} style={[s.tipText, { marginBottom: 2 }]}>{t}</Text>
          ))}
        </View>

        {/* When phone doesn't work */}
        <Text style={s.sectionTitle}>手機不通時怎麼辦</Text>
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {[
            '撥打 1991 災害留言板：錄音留言「我是 [姓名]，在 [地點]，[狀況]」',
            '家人也撥 1991 輸入你的手機號碼就能聽留言',
            '前往約定集合點等候（每 2 小時回來確認一次）',
            '在住家門口用筆留字條：「[日期時間] 全家已前往 [集合點名稱]」',
            '到集合點後向現場志工登記姓名與人數',
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>▶</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Emergency Contacts */}
        <Text style={s.sectionTitle}>緊急聯絡人</Text>
        {allContacts.map((c, i) => (
          <View key={i} style={s.contactCard}>
            <Text style={s.contactName}>{c.name}（{c.relation}）</Text>
            <Text style={s.contactPhone}>{c.phone}</Text>
            {c.phoneBackup ? <Text style={s.contactMeta}>備用：{c.phoneBackup}</Text> : null}
            {c.isOutOfCity && (
              <Text style={[s.contactMeta, { color: '#d4882a', fontWeight: 'bold' }]}>
                {biMode === 'en' ? 'Out-of-city contact — call this person when disconnected from family' : '外縣市聯絡人 — 失聯時全家各自打這支，由他確認大家狀況'}
              </Text>
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
          每位成員的避難、健康、聯絡資訊。急救時請出示此頁給醫護人員。沿虛線剪下隨身卡放進皮夾。
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
                      <Text style={s.pCardValue}>{m.birthYear} 年生（{new Date().getFullYear() - Number(m.birthYear)} 歲）</Text>
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
                  <Text style={s.pCardValue}>119消防 110警察 166防空 1991留言板</Text>
                </View>
              </View>
            </View>
          )
        })}

        {mainHospital && (
          <View style={[s.tipBox, { marginTop: 4 }]}>
            <Text style={s.tipText}>
              {biMode === 'en' ? 'Nearest: ' : '最近醫療機構：'}{mainHospital.name}
              {mainHospital.hasER ? '（有急診）' : ''}
              {mainHospital.distance ? `　${distText(mainHospital.distance)}` : ''}
              {mainHospital.phone ? `　${mainHospital.phone}` : ''}
            </Text>
          </View>
        )}
        <Footer label={biMode === "en" ? "Family Data (show to paramedics)" : "家人資料（急救時出示給醫護人員）"} biMode={biMode} />
      </Page>

      {/* ─── FOREIGN NATIONAL INFO ─── */}
      {household.isForeignNational && (() => {
        const res = FOREIGN_RESOURCES.find(r => r.nationality === household.nationality)
        return (
          <Page size="A4" style={s.page}>
            <Text style={[s.scenarioTitle, { borderBottomColor: '#0ea5e9', color: '#0ea5e9' }]}>
              外籍人士專用資訊 Information for Foreign Nationals
            </Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>
              災難時，所有避難所對所有人開放，不分國籍、不查身分證件。請安心前往避難。
            </Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>
              During disasters, all shelters are open to everyone regardless of nationality. No ID check required.
            </Text>

            <Text style={s.sectionTitle}>多語求助專線 Multilingual Hotlines</Text>
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
              <Text style={s.sectionTitle}>母國駐台代表處 Representative Office ({res.nameNative})</Text>
              <View style={s.contactCard}>
                <Text style={s.contactName}>{res.embassy}</Text>
                <Text style={s.contactPhone}>{res.embassyPhone}</Text>
                <Text style={[s.contactMeta, { marginTop: 2 }]}>{res.embassyAddress}</Text>
                {res.emergencyPhone && (
                  <Text style={[s.contactMeta, { color: '#e04545', fontWeight: 'bold', marginTop: 2 }]}>
                    緊急電話 Emergency: {res.emergencyPhone}
                  </Text>
                )}
              </View>
            </>)}

            {(household.employerName || household.brokerName) && (
              <>
                <Text style={s.sectionTitle}>雇主 / 仲介 Employer / Broker</Text>
                {household.employerName && (
                  <View style={s.contactCard}>
                    <Text style={s.contactName}>雇主 Employer：{household.employerName}</Text>
                    {household.employerPhone && <Text style={s.contactPhone}>{household.employerPhone}</Text>}
                  </View>
                )}
                {household.brokerName && (
                  <View style={s.contactCard}>
                    <Text style={s.contactName}>仲介 Broker：{household.brokerName}</Text>
                    {household.brokerPhone && <Text style={s.contactPhone}>{household.brokerPhone}</Text>}
                  </View>
                )}
              </>
            )}

            <Text style={s.sectionTitle}>重要提醒 Important Reminders</Text>
            <View style={[s.warningBox, { backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd' }]}>
              {[
                '護照和居留證放在防水袋中，隨緊急背包一起帶走',
                'Keep your passport and ARC in a waterproof bag with your emergency kit',
                '災難期間就醫，健保卡可使用，外籍人士同樣適用',
                'Your NHI card works during disasters — same coverage as citizens',
                '不要因為身分問題而不敢去避難所。避難所不會查證件',
                'Do not hesitate to go to a shelter. No ID verification required',
                '撥打 1955 可用母語溝通（越/印/泰/英語服務）',
                'Call 1955 for help in your language (Vietnamese/Indonesian/Thai/English)',
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
            <Text style={s.checkCat}>{pt(biMode, 'supply_food')}（{allMembers.length} 人份）</Text>
            {([
              `飲用水 ${allMembers.length * 6} 公升（每人 2L/天 × 3 天）`,
              pt(biMode, 'chk_food_instant'),
              pt(biMode, 'chk_food_rice'),
              household.hasInfant ? `嬰幼兒奶粉/配方奶 3 天份（${household.infantInfo || '嬰幼兒'}）` : '奶粉/副食品（如有嬰幼兒）',
              household.hasInfant ? '嬰兒副食品（米精、果泥罐頭）' : null,
              pt(biMode, 'chk_utensils'),
              household.hasPets ? `寵物：${household.petInfo || '飼料'} 3 天份 + 飲水` : null,
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
              ...allMembers.filter(m => m.medications).map(m => `${m.name} 的藥：${m.medications}（至少 7 天份）`),
              ...allMembers.filter(m => m.allergies).map(m => `抗過敏藥（${m.name}：${m.allergies}）`),
              pt(biMode, 'chk_thermometer'),
              pt(biMode, 'chk_masks'),
              pt(biMode, 'chk_saline'),
              allMembers.some(m => m.isMobilityImpaired) ? '輪椅/助行器 備品及電池' : null,
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
              household.hasInfant ? '嬰兒尿布（至少 30 片，3 天份）' : null,
              household.hasInfant ? '嬰兒濕紙巾（無酒精）' : null,
              household.hasInfant ? '奶瓶 2 支 + 奶瓶刷 + 瓶裝水（沖泡用）' : null,
              household.hasInfant ? '嬰兒背帶或揹巾（疏散時解放雙手）' : null,
              household.hasInfant ? '安撫奶嘴或安撫玩具' : null,
              !household.hasInfant ? '嬰兒尿布（如適用）' : null,
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
              `雨衣 ${allMembers.length} 件`,
              pt(biMode, 'chk_clothes'),
              pt(biMode, 'chk_jacket'),
              pt(biMode, 'chk_gloves'),
              pt(biMode, 'chk_knife'),
              pt(biMode, 'chk_rope'),
              pt(biMode, 'chk_fire'),
              household.hasPets ? `寵物提籠 / 牽繩` : null,
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
              ? '你住地下樓層。走安全梯往上到 1 樓離開建築物（不搭電梯！）'
              : `走安全梯下樓（不搭電梯！你住 ${household.floor || '?'} 樓），到 1 樓離開建築物`
            : '確認房屋結構沒有明顯裂縫後再移動，從最近出口離開',
          `帶緊急背包，前往集合點：${mainShelter?.name ?? '最近公園'}`,
          '到達後清點家人，未到者打電話或等候',
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
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>▶</Text>
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
          '離開後打 119：說明地址「' + fullAddr + '」、火源位置、是否有人受困',
          pt(biMode, 'fire_6'),
          `前往集合點 ${mainShelter?.name ?? '最近廣場'}，確認所有家人到齊`,
        ] as string[]).map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#d4882a' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}
        <Footer label={biMode === "en" ? "Air Raid / Fire Guide" : "防空 / 火災應對指南"} biMode={biMode} />
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
              <Text style={{ color: '#3b6fd4', marginRight: 5, fontSize: 9 }}>▶</Text>
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
          '緊急物資有效期（食物、藥品、電池）',
          '飲用水更換（自來水存放不超過 6 個月）',
          '行動電源充電',
          '滅火器壓力錶是否在綠色區域',
          '住警器電池是否需要更換',
          '家人手機號碼是否有變動 → 更新本手冊',
          '聯絡人電話是否有效 → 打一通確認',
          '緊急背包是否在玄關、容易拿取',
          '與家人復習集合點位置',
          '有搬家、換藥、新生兒 → 重新產生手冊',
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
