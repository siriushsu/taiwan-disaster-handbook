import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { HandbookData, LocationInfo, Shelter, MedicalFacility, Member } from '@/types'

Font.register({
  family: 'NotoSansTC',
  fonts: [
    { src: '/fonts/NotoSansTC-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSansTC-Bold.ttf', fontWeight: 'bold' },
  ],
})

/* ── helpers ───────────────────────────────────────── */
function distText(m?: number) {
  if (!m) return ''
  return m < 1000 ? `${m} 公尺` : `${(m / 1000).toFixed(1)} 公里`
}
function walkMin(m?: number) {
  if (!m) return ''
  const mins = Math.ceil(m / 80)
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
  contactPhone: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6', marginTop: 2 },
  contactMeta: { fontSize: 8, color: '#6b7280', marginTop: 1 },
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

function Footer({ label }: { label: string }) {
  return <View style={s.footer} fixed>
    <Text style={s.footerText}>家庭防災手冊</Text>
    <Text style={s.footerText}>{label}</Text>
  </View>
}

/* ══════════════════════════════════════════════════════
   PAGE: Location Evacuation Guide
   ══════════════════════════════════════════════════════ */
function LocationPage({ loc }: { loc: LocationInfo }) {
  const natural = loc.shelters.filter((sh: Shelter) => sh.type !== 'air_defense')
  const air = loc.airRaid ?? []
  const mainShelter = natural[0]
  const backupShelter = natural[1]

  return (
    <Page size="A4" style={s.page}>
      <View style={s.locHeader}>
        <Text style={s.locTitle}>{loc.label}　完整避難指南</Text>
        <Text style={s.locAddr}>{loc.address}</Text>
        {loc.housingType === 'apartment' && loc.floor
          ? <Text style={s.locAddr}>公寓大樓 {loc.floor} 樓</Text>
          : null}
      </View>

      {/* Meeting Points */}
      <Text style={s.sectionTitle}>家人集合點</Text>
      <Text style={{ fontSize: 8.5, color: '#6b7280', marginBottom: 4 }}>
        災難發生後，全家人應前往以下地點會合。到達後清點人數，未到者由外縣市聯絡人協調。
      </Text>
      <View style={s.meetBox}>
        <View style={[s.meetCard, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
          <Text style={[s.meetLabel, { color: '#3b82f6' }]}>主要集合點</Text>
          <Text style={s.meetValue}>{mainShelter?.name ?? '最近的公園或廣場'}</Text>
          {mainShelter?.address ? <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{mainShelter.address}</Text> : null}
          {mainShelter?.distance ? <Text style={{ fontSize: 8, color: '#059669', marginTop: 1 }}>{distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}）</Text> : null}
        </View>
        <View style={[s.meetCard, { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' }]}>
          <Text style={[s.meetLabel, { color: '#c2410c' }]}>備用集合點</Text>
          <Text style={s.meetValue}>{backupShelter?.name ?? '里辦公室或區公所'}</Text>
          {backupShelter?.address ? <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>{backupShelter.address}</Text> : null}
          {backupShelter?.distance ? <Text style={{ fontSize: 8, color: '#059669', marginTop: 1 }}>{distText(backupShelter.distance)}（{walkMin(backupShelter.distance)}）</Text> : null}
        </View>
      </View>

      {/* Nearest shelters */}
      <Text style={s.sectionTitle}>附近避難收容所（政府指定）</Text>
      {natural.length > 0 ? natural.map((sh: Shelter, i: number) => (
        <View key={i} style={s.shelterCard}>
          <Text style={s.shelterNum}>{i + 1}</Text>
          <View style={s.shelterInfo}>
            <Text style={s.shelterName}>{sh.name}</Text>
            {sh.address ? <Text style={s.shelterAddr}>{sh.address}</Text> : null}
            <Text style={s.shelterDist}>
              {distText(sh.distance)}（{walkMin(sh.distance)}）
              {sh.capacity ? `　可容納 ${sh.capacity.toLocaleString()} 人` : ''}
              {sh.indoor ? '　室內' : ''}
            </Text>
            {sh.disasterTypes ? <Text style={s.shelterAddr}>適用災害：{sh.disasterTypes}</Text> : null}
            {sh.phone ? <Text style={s.shelterAddr}>管理電話：{sh.phone}</Text> : null}
            {sh.vulnerableFriendly ? <Text style={{ fontSize: 7.5, color: '#059669', marginTop: 1 }}>適合避難弱者（長者、身障者）安置</Text> : null}
          </View>
        </View>
      )) : (
        <View style={s.noDataBox}>
          <Text style={{ fontSize: 9, color: '#854d0e' }}>
            查無附近收容所資料。請向里辦公室查詢，或撥打 0800-024-985。
          </Text>
        </View>
      )}
      <Text style={s.shelterTag}>資料來源：內政部消防署 避難收容處所開放資料</Text>

      {/* Air defense shelters */}
      {air.length > 0 && (<>
        <Text style={s.sectionTitle}>防空避難所（軍事衝突用）</Text>
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
        <Text style={s.sectionTitle}>最近醫療院所</Text>
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
        <Text style={s.sectionTitle}>公寓大樓逃生重點</Text>
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {[
            `您住 ${loc.floor || '?'} 樓。地震後走安全梯下樓，絕對不搭電梯`,
            '開門前先用手背感覺門溫。門燙＝外面有火，留在室內等救援',
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
        <Text style={s.sectionTitle}>透天厝逃生重點</Text>
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

      <Footer label={`${loc.label} 避難指南`} />
    </Page>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
export default function HandbookPDF({ data }: { data: HandbookData }) {
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
          <Text style={s.coverTitle}>家庭防災手冊</Text>
          <Text style={s.coverSub}>緊急時請依本手冊指示行動</Text>
          <View style={s.coverBox}>
            <Text style={s.coverBoxLabel}>主住家地址</Text>
            <Text style={s.coverBoxValue}>{fullAddr}</Text>
          </View>
          <View style={s.coverBox}>
            <Text style={s.coverBoxLabel}>家庭成員</Text>
            <Text style={s.coverBoxValue}>{allMembers.map(m => m.name).join('、') || '—'}</Text>
          </View>
          {mainShelter && (
            <View style={s.coverBox}>
              <Text style={s.coverBoxLabel}>災後集合點</Text>
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
            <Text style={s.coverBoxLabel}>製作日期</Text>
            <Text style={{ color: '#ffffff', fontSize: 11 }}>{data.generatedAt}　建議每年更新</Text>
          </View>
        </View>
        <View style={s.coverFooter}>
          <Text>列印後放在家中顯眼位置（冰箱旁或玄關）。每位家人都要知道這本手冊放在哪裡。</Text>
        </View>
      </Page>

      {/* ─── PAGE 2: EMERGENCY ACTION CARD ─── */}
      <Page size="A4" style={s.actionPage}>
        <View style={s.actionBanner}>
          <Text style={s.actionBannerText}>緊急行動卡 — 撕下此頁貼在冰箱上</Text>
          <Text style={s.actionBannerSub}>任何災難的前 3 分鐘決定生死。看完這頁你就知道該怎麼做。</Text>
        </View>

        {/* Earthquake */}
        <View style={[s.actionRow, { borderColor: '#e04545' }]}>
          <Text style={s.actionEmoji}>1</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: '#e04545' }]}>地震</Text>
            <Text style={s.actionBody}>
              趴下 → 躲桌下或靠牆蹲 → 護頭 → 搖停後穿鞋關瓦斯 → 走樓梯（不搭電梯）→ 前往集合點
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
            <Text style={[s.actionLabel, { color: '#d4882a' }]}>火災</Text>
            <Text style={s.actionBody}>
              {household.housingType === 'apartment'
                ? `低姿勢爬行 → 摸門把不燙才開門 → 走安全梯下${household.floor ? ` ${household.floor} 樓` : '樓'} → 打 119`
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
              警報發布 → 備妥 72 小時物資 → 收室外物品 → 關窗 → 低窪地區提前撤離 → 停電就關總開關
            </Text>
          </View>
        </View>

        {/* MAIN MEETING POINT */}
        <View style={s.actionMeet}>
          <Text style={s.actionMeetLabel}>災後全家集合地點</Text>
          <Text style={s.actionMeetValue}>{mainShelter?.name ?? '最近公園或廣場'}</Text>
          {mainShelter?.distance && (
            <Text style={s.actionMeetDist}>
              距離住家 {distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}）
            </Text>
          )}
          {mainShelter?.address && <Text style={s.actionMeetDist}>{mainShelter.address}</Text>}
        </View>

        {/* Key numbers */}
        <View style={s.twoCol}>
          <View style={s.col}>
            {([
              ['119', '消防救護'],
              ['110', '警察'],
              ['166', '防空警報'],
            ] as [string, string][]).map(([n, l]) => (
              <View key={n} style={s.numRow}>
                <Text style={s.numBig}>{n}</Text>
                <Text style={s.numLabel}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={s.col}>
            {([
              ['1991', '災害留言板'],
              ['1925', '安心專線'],
              ['0800-024-985', '災防專線'],
            ] as [string, string][]).map(([n, l]) => (
              <View key={n} style={s.numRow}>
                <Text style={[s.numBig, { fontSize: n.length > 4 ? 14 : 20 }]}>{n}</Text>
                <Text style={s.numLabel}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer label="緊急行動卡（請貼冰箱）" />
      </Page>

      {/* ─── PAGE 3: FAMILY REUNION & COMMUNICATION PLAN ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#3b82f6', color: '#3b82f6' }]}>
          家人集合與通訊計畫
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>
          災難後手機可能不通。事先約好集合點和聯絡順序，是找到家人最可靠的方法。
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
            '1. 先確認自身安全，離開危險區域',
            '2. 發一則簡訊或 LINE 給家庭群組：「我在 [地點]，[安全/受傷]」',
            '3. 簡訊比電話更容易在網路壅塞時送出',
            outOfCityContact
              ? `4. 若聯繫不上家人，打給外縣市聯絡人 ${outOfCityContact.name}（${outOfCityContact.phone}），請他統一回報`
              : '4. 若聯繫不上家人，前往約定集合點等候',
            '5. 前往集合點，到達後清點家人',
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
                外縣市聯絡人 — 失聯時全家各自打這支，由他確認大家狀況
              </Text>
            )}
          </View>
        ))}

        <Footer label="家人集合與通訊計畫" />
      </Page>

      {/* ─── PAGES 4+: LOCATION EVACUATION GUIDES ─── */}
      {data.locations.map((loc, i) => (
        <LocationPage key={i} loc={loc} />
      ))}

      {/* ─── PERSONAL CARRY CARDS ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#3b82f6', color: '#3b82f6' }]}>
          個人隨身卡 — 沿虛線剪下，放進皮夾
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 10 }}>
          每位家人各剪一張隨身攜帶。受傷昏迷時，救護人員可以看到你的關鍵資訊。
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
                <Text style={s.pCardBlood}>血型 {m.bloodType}</Text>
              </View>
              <View style={s.pCardRow}>
                <Text style={s.pCardLabel}>住址</Text>
                <Text style={s.pCardValue}>{addr}</Text>
              </View>
              <View style={s.pCardRow}>
                <Text style={s.pCardLabel}>集合點</Text>
                <Text style={[s.pCardValue, { fontWeight: 'bold' }]}>{shelter?.name ?? '—'}</Text>
              </View>
              {m.allergies && (
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>過敏</Text>
                  <Text style={[s.pCardValue, { color: '#e04545', fontWeight: 'bold' }]}>{m.allergies}</Text>
                </View>
              )}
              {m.medications && (
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>用藥</Text>
                  <Text style={s.pCardValue}>{m.medications}</Text>
                </View>
              )}
              {m.isMobilityImpaired && (
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>特殊</Text>
                  <Text style={[s.pCardValue, { color: '#e04545' }]}>行動不便，需協助撤離</Text>
                </View>
              )}
              {emergContact && (
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>緊急聯絡</Text>
                  <Text style={[s.pCardValue, { fontWeight: 'bold' }]}>{emergContact.name} {emergContact.phone}</Text>
                </View>
              )}
              <View style={s.pCardRow}>
                <Text style={s.pCardLabel}>119 消防</Text>
                <Text style={s.pCardValue}>110 警察　166 防空　1991 留言板</Text>
              </View>
            </View>
          )
        })}

        <Footer label="個人隨身卡" />
      </Page>

      {/* ─── HEALTH DATA ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#059669', color: '#059669' }]}>
          家庭成員健康資料
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 8 }}>
          急救或送醫時，請出示此頁給醫護人員。可加快診斷與用藥判斷。
        </Text>
        {allMembers.map((m, i) => (
          <View key={i} style={s.memberCard}>
            <Text style={s.memberName}>{m.name}</Text>
            <View style={s.twoCol}>
              <View style={s.col}>
                {m.birthYear ? (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>出生年 / 年齡</Text>
                    <Text style={s.infoValue}>{m.birthYear} 年（{new Date().getFullYear() - Number(m.birthYear)} 歲）</Text>
                  </View>
                ) : null}
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>血型</Text>
                  <Text style={[s.infoValue, { fontWeight: 'bold', fontSize: 12 }]}>{m.bloodType}</Text>
                </View>
                {m.hasDifferentAddress && m.address ? (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>居住地址</Text>
                    <Text style={s.infoValue}>{m.city}{m.district}{m.address}</Text>
                  </View>
                ) : null}
              </View>
              <View style={s.col}>
                {m.hasChronic && (
                  <View style={[s.alertBadge, { backgroundColor: '#fef2f2' }]}>
                    <Text style={s.alertText}>有慢性病</Text>
                  </View>
                )}
                {m.medications ? (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>長期用藥</Text>
                    <Text style={[s.infoValue, { fontWeight: 'bold' }]}>{m.medications}</Text>
                  </View>
                ) : null}
                {m.allergies ? (
                  <View style={[s.alertBadge, { backgroundColor: '#fef2f2', marginTop: 4 }]}>
                    <Text style={[s.alertText, { fontWeight: 'bold' }]}>過敏：{m.allergies}</Text>
                  </View>
                ) : null}
                {m.isMobilityImpaired ? (
                  <View style={[s.alertBadge, { backgroundColor: '#fff7ed', marginTop: 4 }]}>
                    <Text style={[s.alertText, { color: '#c2410c' }]}>行動不便，疏散需協助</Text>
                  </View>
                ) : null}
                {m.specialNeeds ? (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>特殊需求</Text>
                    <Text style={s.infoValue}>{m.specialNeeds}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ))}
        {mainHospital && (
          <View style={[s.tipBox, { marginTop: 6 }]}>
            <Text style={s.tipText}>
              最近醫療機構：{mainHospital.name}
              {mainHospital.hasER ? '（有急診）' : ''}
              {mainHospital.distance ? `　${distText(mainHospital.distance)}` : ''}
              {mainHospital.phone ? `　${mainHospital.phone}` : ''}
            </Text>
          </View>
        )}
        <Footer label="健康資料（出示給醫護人員）" />
      </Page>

      {/* ─── 72-HOUR SUPPLY CHECKLIST ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#16a34a', color: '#15803d' }]}>
          72 小時緊急物資清單
        </Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
          大型災難後可能 3 天沒有外援。以下物資請平時備妥，每半年檢查有效期。勾選已備妥項目。
        </Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.checkCat}>飲水與食物（{allMembers.length} 人份）</Text>
            {([
              `飲用水 ${allMembers.length * 6} 公升（每人 2L/天 × 3 天）`,
              '即食食品（罐頭、餅乾、能量棒、巧克力）',
              '即食米飯或泡麵（不需開火可食用的）',
              '奶粉/副食品（如有嬰幼兒）',
              '免洗餐具和開罐器',
              household.hasPets ? `寵物：${household.petInfo || '飼料'} 3 天份 + 飲水` : null,
            ] as (string|null)[]).filter(Boolean).map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>急救與藥品</Text>
            {([
              '急救包（OK 繃、紗布、消毒液、剪刀）',
              '止痛退燒藥、腸胃藥',
              ...allMembers.filter(m => m.medications).map(m => `${m.name} 的藥：${m.medications}（至少 7 天份）`),
              ...allMembers.filter(m => m.allergies).map(m => `抗過敏藥（${m.name}：${m.allergies}）`),
              '體溫計',
              '口罩（每人 10 片以上）',
              '生理食鹽水',
              allMembers.some(m => m.isMobilityImpaired) ? '輪椅/助行器 備品及電池' : null,
            ] as (string|null)[]).filter(Boolean).map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>衛生用品</Text>
            {[
              '濕紙巾、衛生紙',
              '垃圾袋（大型，可當臨時馬桶）',
              '個人衛生用品',
              '嬰兒尿布（如適用）',
            ].map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={s.col}>
            <Text style={s.checkCat}>通訊與照明</Text>
            {[
              '手搖式或太陽能收音機（收聽 FM 廣播）',
              '手電筒 + 備用電池 × 2 組',
              '行動電源（已充飽，10000mAh 以上）',
              '哨子（每人一個，被困時求救）',
              '螢光棒（夜間標示位置）',
            ].map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>文件與現金</Text>
            {[
              '身分證 / 健保卡影本（每人）',
              '存摺、保險單影本',
              '本手冊影本（特別是隨身卡頁）',
              '現金小鈔 至少 NT$ 5,000',
              '防水夾鏈袋（裝文件）',
            ].map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>衣物與工具</Text>
            {([
              `雨衣 ${allMembers.length} 件`,
              '換洗衣物（每人 3 天份）',
              '保暖外套或毛毯',
              '工作手套 + 厚底鞋',
              '瑞士刀或多功能工具',
              '繩索 5 公尺',
              '打火機或防水火柴',
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
            建議準備一個「緊急背包」放在玄關。災難來臨時抓了就走，不要花時間找東西。
          </Text>
        </View>
        <Footer label="72 小時物資清單" />
      </Page>

      {/* ─── SCENARIO: EARTHQUAKE ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#e04545', color: '#e04545' }]}>
          地震完整應對指南
        </Text>

        <Text style={[s.sectionTitle, { color: '#e04545', borderBottomColor: '#fecaca' }]}>在家中</Text>
        {[
          '立刻「趴下、掩護、抓緊」— 鑽到堅固桌子下，雙手護住頭頸',
          '遠離窗戶、書架、吊燈、電視等易倒物品',
          '搖晃停止後，穿鞋（地上有碎玻璃），確認家人安全',
          '關閉瓦斯總開關，檢查電器是否損壞',
          household.housingType === 'apartment'
            ? `走安全梯下樓（不搭電梯！你住 ${household.floor || '?'} 樓），到 1 樓離開建築物`
            : '確認房屋結構沒有明顯裂縫後再移動，從最近出口離開',
          `帶緊急背包，前往集合點：${mainShelter?.name ?? '最近公園'}`,
          '到達後清點家人，未到者打電話或等候',
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#e04545' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#e04545', borderBottomColor: '#fecaca' }]}>在戶外</Text>
        {[
          '遠離建築物、電線桿、招牌。蹲在空曠處護頭',
          '若在開車：慢慢靠邊停車，留在車內等搖晃停止',
          '若在山區：遠離山壁和懸崖，注意落石和土石流',
          '搖晃停止後前往最近避難所或家庭集合點',
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#e04545' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#e04545', borderBottomColor: '#fecaca' }]}>地震後注意事項</Text>
        <View style={[s.warningBox, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }]}>
          {[
            '注意餘震！大地震後數小時內可能有強烈餘震',
            '不要進入受損建築物，即使是自己的家',
            '如果聞到瓦斯味，立刻離開、打開窗戶，到戶外再打電話',
            '收聽 FM 廣播獲取政府最新指示（手機可能不通）',
            '不要散播未經證實的消息',
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#e04545', marginRight: 5, fontSize: 9 }}>▶</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>{t}</Text>
            </View>
          ))}
        </View>
        <Footer label="地震應對指南" />
      </Page>

      {/* ─── SCENARIO: AIR RAID + FIRE ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#8b5cf6', color: '#8b5cf6' }]}>
          防空警報應對指南
        </Text>
        <View style={[s.warningBox, { backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#d8b4fe', marginBottom: 6 }]}>
          <Text style={{ fontSize: 9, color: '#8b5cf6', fontWeight: 'bold' }}>
            警報聲音辨識：連續長音 90 秒 ＝ 防空警報（立刻躲避）｜連續短音 30 秒 ＝ 解除警報
          </Text>
        </View>

        <Text style={[s.sectionTitle, { color: '#8b5cf6', borderBottomColor: '#d8b4fe' }]}>聽到警報後</Text>
        {[
          '立刻進入地下室、地下停車場、捷運站、或任何地下空間',
          '若沒有地下空間：進入堅固建築低樓層（避開玻璃帷幕大樓），遠離窗戶',
          '若在家中：到廁所或走廊（最內側無窗房間），坐在地上背靠牆',
          '關閉門窗，拉上窗簾（減少玻璃碎片飛濺）',
          '打開收音機收聽官方廣播',
          '聽到「解除警報」（短音 30 秒）才能離開掩蔽處',
          '不要相信社群媒體謠言，只信任政府官方管道',
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#8b5cf6' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}
        <View style={[s.tipBox, { borderColor: '#d8b4fe' }]}>
          <Text style={[s.tipText, { color: '#8b5cf6' }]}>
            平時就要記住：住家附近的地下停車場入口、最近的捷運站、堅固地下室在哪裡。
          </Text>
        </View>

        <Text style={[s.scenarioTitle, { borderBottomColor: '#d4882a', color: '#d4882a', marginTop: 12 }]}>
          火災應對指南
        </Text>
        <Text style={[s.sectionTitle, { color: '#d4882a', borderBottomColor: '#fed7aa' }]}>發現火災時</Text>
        {([
          '大喊「失火了！」通知同住者，同時按下住警器（如有）',
          household.housingType === 'apartment'
            ? '摸門把：不燙 → 低姿勢開門逃生；門燙 → 不要開門，用濕毛巾塞門縫，到窗邊等救援'
            : '立刻從最近出口逃離，不嘗試滅火（除非極小範圍）',
          '低姿勢移動（煙在上方），用濕毛巾遮口鼻',
          '不搭電梯，走安全梯。下樓時沿右側靠牆',
          '離開後打 119：說明地址「' + fullAddr + '」、火源位置、是否有人受困',
          '絕對不要回頭拿東西。人出來就好',
          `前往集合點 ${mainShelter?.name ?? '最近廣場'}，確認所有家人到齊`,
        ] as string[]).map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#d4882a' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}
        <Footer label="防空 / 火災應對指南" />
      </Page>

      {/* ─── SCENARIO: TYPHOON + FLOOD ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#3b6fd4', color: '#3b6fd4' }]}>
          颱風與水災應對指南
        </Text>

        <Text style={[s.sectionTitle, { color: '#3b6fd4', borderBottomColor: '#bfdbfe' }]}>颱風來臨前 24 小時</Text>
        {[
          '確認 72 小時緊急物資已備妥，特別是飲用水和手電筒',
          '把陽台、頂樓的所有物品移入室內（花盆會變致命武器）',
          '用膠帶在窗戶貼「米」字型，減少碎裂飛散（或拉上鐵捲門）',
          '充飽行動電源和所有手機',
          '將重要文件放入防水袋',
          '低窪地區：陸上警報發布後就撤離，不要等到水漲才走',
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#3b6fd4' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#3b6fd4', borderBottomColor: '#bfdbfe' }]}>颱風期間</Text>
        {[
          '待在室內，遠離窗戶。不要外出看風雨',
          '如果窗戶破裂：立刻離開那個房間，關上房門擋風',
          '停電後：關閉所有電器的電源開關，防止回電時損壞',
          '如果開始淹水：切斷電源總開關（防觸電），往高處移動',
          '準備好緊急背包，隨時可能需要撤離到避難所',
        ].map((text, i) => (
          <View key={i} style={s.step}>
            <Text style={[s.stepNum, { backgroundColor: '#3b6fd4' }]}>{i + 1}</Text>
            <Text style={s.stepText}>{text}</Text>
          </View>
        ))}

        <Text style={[s.sectionTitle, { color: '#3b6fd4', borderBottomColor: '#bfdbfe' }]}>颱風過後</Text>
        <View style={[s.warningBox, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
          {[
            '確認房屋結構安全才進入。注意天花板是否有水痕',
            '不要碰觸掉落的電線，通報 1911 台電服務專線',
            '避開淹水區域（水中可能有漏電或汙水）',
            '清理積水防止登革熱孳生',
            '拍照記錄房屋損壞情形，作為保險理賠依據',
          ].map((t, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
              <Text style={{ color: '#3b6fd4', marginRight: 5, fontSize: 9 }}>▶</Text>
              <Text style={{ flex: 1, fontSize: 9 }}>{t}</Text>
            </View>
          ))}
        </View>

        <Footer label="颱風水災應對指南" />
      </Page>

      {/* ─── IMPORTANT REMINDERS ─── */}
      <Page size="A4" style={s.page}>
        <Text style={[s.scenarioTitle, { borderBottomColor: '#374151', color: '#374151' }]}>
          重要備忘與定期檢查
        </Text>

        <Text style={s.sectionTitle}>住家安全設備位置（請手寫填入）</Text>
        {[
          '瓦斯總開關位置：＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
          '電源總開關位置：＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
          '水表位置：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
          '滅火器位置：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
          '逃生出口（安全梯）位置：＿＿＿＿＿＿＿＿＿＿',
          '大樓管理員電話：＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
        ].map((t, i) => (
          <Text key={i} style={{ fontSize: 10, marginBottom: 6 }}>{t}</Text>
        ))}

        <Text style={s.sectionTitle}>半年一次定期檢查</Text>
        <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>建議每年 3 月和 9 月各做一次。</Text>
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

        <Text style={s.sectionTitle}>重要資訊備忘（請手寫填入）</Text>
        {[
          '家庭醫師姓名 / 電話：＿＿＿＿＿＿＿＿＿＿＿',
          '保險公司 / 保單號碼：＿＿＿＿＿＿＿＿＿＿＿',
          '車牌號碼：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
          '寵物晶片號碼：＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
          '其他：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
        ].map((t, i) => (
          <Text key={i} style={{ fontSize: 10, marginBottom: 6 }}>{t}</Text>
        ))}

        <View style={[s.tipBox, { marginTop: 8 }]}>
          <Text style={s.tipText}>
            這本手冊只有在你讀過、你的家人也知道的情況下才有用。
            今天就和家人一起翻一遍，確認每個人都知道集合點在哪裡。
          </Text>
        </View>

        <Footer label="備忘與定期檢查" />
      </Page>

    </Document>
  )
}
