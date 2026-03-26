// 家庭成員
export interface Member {
  name: string;
  birthYear: number | "";
  bloodType: "A" | "B" | "AB" | "O" | "不知道";
  isMobilityImpaired: boolean;
  hasChronic: boolean;
  medications: string;
  allergies: string;
  specialNeeds: string;
  // 白天通常在哪裡（選填）
  dailyLocation: string; // e.g. "信義區上班" "大安區上學"
  dailyCity: string;
  dailyDistrict: string;
  dailyAddress: string;
  // 不同住址（選填）
  hasDifferentAddress: boolean;
  city: string;
  district: string;
  address: string;
}

// 緊急聯絡人
export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  phoneBackup: string;
  isOutOfCity: boolean;
}

// 表單完整資料
export interface HouseholdForm {
  address: string;
  city: string;
  district: string;
  housingType: "apartment" | "house" | "rural";
  floor: string; // e.g. "8", "B1", "B2", "1.5"
  hasPets: boolean;
  petInfo: string;
  hasInfant: boolean;
  infantInfo: string;
  isForeignNational: boolean;
  nationality: string; // 'VN' | 'ID' | 'PH' | 'TH' | 'JP' | 'US' | ''
  employerName: string;
  employerPhone: string;
  brokerName: string;
  brokerPhone: string;
  members: Member[];
  contacts: EmergencyContact[];
}

// 政府開放資料：避難收容所
export interface Shelter {
  name: string;
  address: string;
  lat: number;
  lng: number;
  capacity?: number;
  type: "natural_disaster" | "air_defense" | "both";
  phone?: string;
  distance?: number;
  disasterTypes?: string; // e.g. "水災,震災,土石流"
  indoor?: boolean;
  vulnerableFriendly?: boolean; // 適合避難弱者安置
  district?: string; // 縣市及鄉鎮市區
  village?: string; // 村里
}

// 政府 API：醫療機構
export interface MedicalFacility {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: "hospital" | "clinic" | "pharmacy";
  hasER: boolean;
  erLevel?: "重度" | "中度" | "一般";
  phone?: string;
  distance?: number;
}

// AED 位置
export interface AedLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  location: string; // AED 放置地點描述
  phone: string;
  distance?: number;
}

// 消防隊
export interface FireStation {
  name: string;
  address: string;
  phone: string;
  city: string;
  lat?: number;
  lng?: number;
  distance?: number;
}

// 派出所
export interface PoliceStation {
  name: string;
  address: string;
  phone: string;
  city: string;
  lat?: number;
  lng?: number;
  distance?: number;
}

// Geocoding 結果
export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

// 每個地址的查詢結果
export interface LocationInfo {
  label: string; // 例：「主住家」「王小明的住所」
  memberName?: string;
  address: string;
  city: string;
  district: string;
  housingType?: "apartment" | "house" | "rural";
  floor?: string;
  geo: GeoLocation | null;
  shelters: Shelter[];
  airRaid: Shelter[];
  medical: MedicalFacility[];
  aed?: AedLocation[];
  erHospital?: MedicalFacility[];
  fireStation?: FireStation[];
  policeStation?: PoliceStation[];
}

// 手冊生成所需的完整資料
export interface HandbookData {
  household: HouseholdForm;
  locations: LocationInfo[]; // index 0 = 主住家，其餘為有不同住址的成員
  generatedAt: string;
}
