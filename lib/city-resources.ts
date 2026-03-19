/** Links to each city's official disaster handbook or prevention page */
export const CITY_DISASTER_LINKS: Record<string, { name: string; url: string; type: 'pdf' | 'web' }[]> = {
  '臺北市': [
    { name: '臺北防災立即go', url: 'https://www.eoc.gov.taipei/DisasterManual/mobile/', type: 'web' },
  ],
  '新北市': [
    { name: '新北市防災手冊', url: 'https://www.dsc.ntpc.gov.tw/', type: 'web' },
  ],
  '桃園市': [
    { name: '桃園市防災資訊網', url: 'https://disaster.tycg.gov.tw/', type: 'web' },
  ],
  '臺中市': [
    { name: '臺中市政府消防局', url: 'https://www.fire.taichung.gov.tw/', type: 'web' },
  ],
  '臺南市': [
    { name: '臺南市防災資訊網', url: 'https://disaster.tainan.gov.tw/', type: 'web' },
  ],
  '高雄市': [
    { name: '高雄市防災手冊', url: 'https://dpr.kcg.gov.tw/Content_List.aspx?n=947F1EE838E5E371', type: 'web' },
  ],
  '基隆市': [
    { name: '基隆市災害防救辦公室', url: 'https://www.klfd.klcg.gov.tw/', type: 'web' },
  ],
  '新竹市': [
    { name: '新竹市消防局', url: 'https://www.hcfd.gov.tw/', type: 'web' },
  ],
  '嘉義市': [
    { name: '嘉義市消防局', url: 'https://cyfd.chiayi.gov.tw/', type: 'web' },
  ],
}

// General resources for all cities
export const GENERAL_DISASTER_LINKS = [
  { name: '全民防衛動員署 — 防災手冊', nameEn: 'MND Emergency Handbook', urlZh: 'https://prepare.mnd.gov.tw/assets/pdf/manual.pdf', urlEn: 'https://prepare.mnd.gov.tw/assets/pdf/manual-en.pdf' },
  { name: '內政部消防署 — 防災手冊下載', nameEn: 'NFA Disaster Handbooks', url: 'https://www.nfa.gov.tw/cht/index.php?code=list&ids=72' },
]
