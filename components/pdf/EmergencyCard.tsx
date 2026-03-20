/**
 * Emergency Card — credit-card sized PDF (85.6mm x 53.98mm)
 * Focus: personal info for family reunification when separated.
 * - Where each family member usually is (work/school)
 * - Emergency contacts & phone numbers
 * - Meeting point after disaster
 * - Blood type & medical needs
 *
 * NOT generic tips — only stuff you can't Google in an emergency.
 */
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { HandbookData } from '@/types'

Font.register({
  family: 'NotoSansTC',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/TC/NotoSansCJKtc-Regular.otf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/TC/NotoSansCJKtc-Bold.otf', fontWeight: 'bold' },
  ],
})

const CARD_W = 242.5  // 85.6mm
const CARD_H = 153    // 53.98mm

const s = StyleSheet.create({
  page: {
    width: CARD_W,
    height: CARD_H,
    fontFamily: 'NotoSansTC',
    backgroundColor: '#ffffff',
    padding: 0,
  },
  header: {
    backgroundColor: '#0D7377',
    padding: '5 8 3 8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 5,
    color: '#ffffff',
    opacity: 0.8,
  },
  body: {
    padding: '4 8',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#0D7377',
    marginBottom: 1.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    paddingBottom: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  nameCol: {
    width: 28,
    fontSize: 5.5,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailCol: {
    flex: 1,
    fontSize: 5,
    color: '#374151',
  },
  detailBold: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  meetingBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 3,
    padding: '3 6',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meetingLabel: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#059669',
    width: 32,
  },
  meetingValue: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#065f46',
    flex: 1,
  },
  footer: {
    backgroundColor: '#f3f4f6',
    padding: '2 8',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 4,
    color: '#9ca3af',
  },
  // Back side
  backHeader: {
    backgroundColor: '#C93B3B',
    padding: '4 8 3 8',
  },
  backTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  backBody: {
    padding: '4 8',
    flex: 1,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    alignItems: 'flex-start',
  },
  contactName: {
    width: 35,
    fontSize: 5.5,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  contactPhone: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#C93B3B',
    flex: 1,
  },
  contactRelation: {
    fontSize: 4.5,
    color: '#6b7280',
  },
  emergNumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderRadius: 3,
    padding: '3 6',
    marginTop: 2,
  },
  emergNum: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#C93B3B',
  },
  emergLabel: {
    fontSize: 4.5,
    color: '#6b7280',
  },
  noteBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 3,
    padding: '3 6',
    marginTop: 3,
  },
  noteText: {
    fontSize: 4.5,
    color: '#92400e',
  },
})

interface Props {
  data: HandbookData
  lang: 'zh' | 'en'
}

export default function EmergencyCard({ data, lang }: Props) {
  const loc = data.locations[0]
  const zh = lang === 'zh'
  const members = data.household.members || []
  const contacts = data.household.contacts?.filter(c => c.name && c.phone) || []
  const meetingPoint = loc?.shelters?.[0]
  const meetingDist = meetingPoint?.distance ? `${Math.round(meetingPoint.distance)}m` : ''
  const meetingAddr = meetingPoint?.address || ''

  // Build member info with daily location and medical flags
  const memberInfos = members.filter(m => m.name).map(m => {
    const locationParts: string[] = []
    if (m.dailyLocation) locationParts.push(m.dailyLocation)
    else if (m.dailyAddress) locationParts.push(m.dailyAddress)
    else if (m.dailyDistrict) locationParts.push(m.dailyDistrict)

    const medParts: string[] = []
    if (m.bloodType && m.bloodType !== '不知道') medParts.push(m.bloodType)
    if (m.medications) medParts.push(zh ? `藥:${m.medications}` : `Meds:${m.medications}`)
    if (m.allergies) medParts.push(zh ? `過敏:${m.allergies}` : `Allergy:${m.allergies}`)
    if (m.isMobilityImpaired) medParts.push(zh ? '行動不便' : 'Mobility')
    if (m.hasChronic) medParts.push(zh ? '慢性病' : 'Chronic')

    return {
      name: m.name,
      location: locationParts.join(' ') || (zh ? '同住址' : 'Home'),
      medical: medParts.join(' / '),
    }
  })

  return (
    <Document>
      {/* ─── FRONT: Family members + where they are ─── */}
      <Page size={{ width: CARD_W, height: CARD_H }} style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>
              {zh ? '家人緊急聯絡卡' : 'FAMILY EMERGENCY CARD'}
            </Text>
            <Text style={s.headerSub}>
              {zh ? 'Family Emergency Card' : loc?.address || ''}
            </Text>
          </View>
          <Text style={{ fontSize: 5, color: '#ffffff', opacity: 0.7 }}>
            {data.generatedAt}
          </Text>
        </View>

        <View style={s.body}>
          {/* Family members: who + where during day */}
          <Text style={s.sectionLabel}>
            {zh ? '家人平日位置' : 'FAMILY DAILY LOCATIONS'}
          </Text>
          {memberInfos.slice(0, 4).map((m, i) => (
            <View key={i} style={s.row}>
              <Text style={s.nameCol}>{m.name}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.detailBold}>{m.location}</Text>
                {m.medical ? <Text style={s.detailCol}>{m.medical}</Text> : null}
              </View>
            </View>
          ))}

          {/* Meeting point */}
          <View style={s.meetingBox}>
            <Text style={s.meetingLabel}>
              {zh ? '災後集合點' : 'MEET AT'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={s.meetingValue}>
                {meetingPoint?.name || '___________'}
                {meetingDist ? ` (${meetingDist})` : ''}
              </Text>
              {meetingAddr ? (
                <Text style={{ fontSize: 4.5, color: '#6b7280' }}>{meetingAddr}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>{loc?.address || ''}</Text>
          <Text style={s.footerText}>disaster-handbook.vercel.app</Text>
        </View>
      </Page>

      {/* ─── BACK: Emergency contacts + phone numbers ─── */}
      <Page size={{ width: CARD_W, height: CARD_H }} style={s.page}>
        <View style={s.backHeader}>
          <Text style={s.backTitle}>
            {zh ? '緊急聯絡資訊' : 'EMERGENCY CONTACTS'}
          </Text>
        </View>

        <View style={s.backBody}>
          {/* Emergency contacts (family/friends outside the household) */}
          {contacts.slice(0, 3).map((c, i) => (
            <View key={i} style={s.contactRow}>
              <Text style={s.contactName}>
                {c.name}
                {c.relation ? <Text style={s.contactRelation}>{` (${c.relation})`}</Text> : null}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={s.contactPhone}>{c.phone}</Text>
                {c.phoneBackup ? (
                  <Text style={{ fontSize: 5, color: '#6b7280' }}>
                    {zh ? '備用：' : 'Alt: '}{c.phoneBackup}
                  </Text>
                ) : null}
                {c.isOutOfCity ? (
                  <Text style={{ fontSize: 4, color: '#059669' }}>
                    {zh ? '(外縣市 - 災時較易撥通)' : '(Out of city - easier to reach)'}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}

          {/* If no contacts filled, show blank lines */}
          {contacts.length === 0 && (
            <View>
              {[1, 2].map(i => (
                <View key={i} style={s.contactRow}>
                  <Text style={s.contactName}>{zh ? `聯絡人${i}` : `Contact ${i}`}:</Text>
                  <Text style={[s.contactPhone, { color: '#d1d5db' }]}>_______________</Text>
                </View>
              ))}
            </View>
          )}

          {/* Emergency numbers */}
          <View style={s.emergNumRow}>
            {[
              { num: '119', label: zh ? '消防' : 'Fire' },
              { num: '110', label: zh ? '警察' : 'Police' },
              { num: '1991', label: zh ? '災害留言板' : 'Disaster Msg' },
              { num: '1925', label: zh ? '安心專線' : 'Crisis Line' },
            ].map((e, i) => (
              <View key={i} style={{ alignItems: 'center' }}>
                <Text style={s.emergNum}>{e.num}</Text>
                <Text style={s.emergLabel}>{e.label}</Text>
              </View>
            ))}
          </View>

          {/* Note about 1991 */}
          <View style={s.noteBox}>
            <Text style={s.noteText}>
              {zh
                ? '1991 留言：撥打後錄音「我是[姓名]，在[地點]，[狀況]」。家人撥 1991 輸入你的手機號碼即可聽取。'
                : '1991: Record "I am [name], at [location], [status]". Family dials 1991 + your phone number to listen.'}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
