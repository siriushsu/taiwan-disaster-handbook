export interface ForeignResource {
  nationality: string
  nameZh: string
  nameNative: string
  embassy: string
  embassyPhone: string
  embassyAddress: string
  emergencyPhone?: string
}

export const FOREIGN_RESOURCES: ForeignResource[] = [
  {
    nationality: 'CN',
    nameZh: '中國',
    nameNative: '中国',
    embassy: '海峽交流基金會（海基會）',
    embassyPhone: '(02) 2175-7000',
    embassyAddress: '台北市中山區北安路536號',
    emergencyPhone: '02-2712-9292',
  },
  {
    nationality: 'VN',
    nameZh: '越南',
    nameNative: 'Việt Nam',
    embassy: '駐台北越南經濟文化辦事處',
    embassyPhone: '(02) 2516-6626',
    embassyAddress: '台北市松山區民生東路三段65號3-4樓',
  },
  {
    nationality: 'ID',
    nameZh: '印尼',
    nameNative: 'Indonesia',
    embassy: '駐台北印尼經濟貿易代表處',
    embassyPhone: '(02) 8752-6170',
    embassyAddress: '台北市內湖區瑞光路550號6樓',
  },
  {
    nationality: 'PH',
    nameZh: '菲律賓',
    nameNative: 'Philippines',
    embassy: '馬尼拉經濟文化辦事處',
    embassyPhone: '(02) 2508-1719',
    embassyAddress: '台北市內湖區洲子街55/57號10樓',
    emergencyPhone: '0966-480-702',
  },
  {
    nationality: 'TH',
    nameZh: '泰國',
    nameNative: 'ประเทศไทย',
    embassy: '泰國貿易經濟辦事處',
    embassyPhone: '(02) 2773-1100',
    embassyAddress: '台北市大安區市民大道三段206號20樓',
  },
  {
    nationality: 'JP',
    nameZh: '日本',
    nameNative: '日本',
    embassy: '日本台灣交流協會台北事務所',
    embassyPhone: '(02) 2713-8000',
    embassyAddress: '台北市松山區慶城街28號',
    emergencyPhone: '(02) 2713-8000 #2',
  },
  {
    nationality: 'US',
    nameZh: '美國',
    nameNative: 'United States',
    embassy: '美國在台協會',
    embassyPhone: '(02) 2162-2000',
    embassyAddress: '台北市內湖區金湖路100號',
    emergencyPhone: '(02) 2162-2000',
  },
]

// Universal hotlines for all foreign nationals in Taiwan
export const FOREIGN_HOTLINES = [
  { number: '1955', name: '外籍勞工 24 小時諮詢保護專線', nameEn: 'Foreign Worker 24hr Hotline', note: '中/英/越/印/泰語服務' },
  { number: '0800-024-111', name: '外來人士在台生活諮詢熱線', nameEn: 'Foreigner Life Consultation', note: '中/英/日/越/印/泰語' },
  { number: '1922', name: '疫情通報及諮詢', nameEn: 'CDC Health Hotline', note: '多語服務' },
]
