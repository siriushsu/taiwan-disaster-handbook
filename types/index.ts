// 家庭成員
export interface Member {
  name: string
  birthYear: number | ''
  bloodType: 'A' | 'B' | 'AB' | 'O' | '不知道'
  isMobilityImpaired: boolean
  hasChronic: boolean
  medications: string
  allergies: string
  specialNeeds: string
  // 不同住址（選填）
  hasDifferentAddress: boolean
  city: string
  district: string
  address: string
}

// 緊急聯絡人
export interface EmergencyContact {
  name: string
  relation: string
  phone: string
  phoneBackup: string
  isOutOfCity: boolean
}

// 表單完整資料
export interface HouseholdForm {
  address: string
  city: string
  district: string
  housingType: 'apartment' | 'house' | 'rural'
  floor: number | ''
  hasPets: boolean
  petInfo: string
  members: Member[]
  contacts: EmergencyContact[]
}

// 政府開放資料：避難收容所
export interface Shelter {
  name: string
  address: string
  lat: number
  lng: number
  capacity?: number
  type: 'natural_disaster' | 'air_defense' | 'both'
  phone?: string
  distance?: number
  disasterTypes?: string       // e.g. "水災,震災,土石流"
  indoor?: boolean
  vulnerableFriendly?: boolean // 適合避難弱者安置
  district?: string            // 縣市及鄉鎮市區
  village?: string             // 村里
}

// 政府 API：醫療機構
export interface MedicalFacility {
  name: string
  address: string
  lat: number
  lng: number
  type: 'hospital' | 'clinic'
  hasER: boolean
  phone?: string
  distance?: number
}

// Geocoding 結果
export interface GeoLocation {
  lat: number
  lng: number
  formattedAddress: string
}

// 每個地址的查詢結果
export interface LocationInfo {
  label: string          // 例：「主住家」「王小明的住所」
  memberName?: string
  address: string
  city: string
  district: string
  housingType?: 'apartment' | 'house' | 'rural'
  floor?: number | ''
  geo: GeoLocation | null
  shelters: Shelter[]
  airRaid: Shelter[]
  medical: MedicalFacility[]
}

// 手冊生成所需的完整資料
export interface HandbookData {
  household: HouseholdForm
  locations: LocationInfo[]   // index 0 = 主住家，其餘為有不同住址的成員
  generatedAt: string
}
