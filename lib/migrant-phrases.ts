/**
 * Emergency phrases for foreign nationals in Taiwan.
 *
 * Review status per language:
 *   - zh: ✅ (source of truth)
 *   - en: ✅ (direct translation)
 *   - vi: ✅ Reviewed (Gemini 2026-04-16, pending native speaker validation)
 *   - id: ✅ Reviewed (Gemini 2026-04-16, pending native speaker validation)
 *   - th: ✅ Reviewed (Gemini 2026-04-16, pending native speaker validation)
 *   - fil: ✅ Reviewed (Gemini 2026-04-16, pending native speaker validation)
 *
 * Next step: send for native-speaker validation via:
 * docs/outreach-email-template.md
 * Priority orgs: Hope Workers' Center, One-Forty
 */

export type PhraseLang = "zh" | "en" | "vi" | "id" | "th" | "fil";

export type PhraseCategory =
  | "medical"
  | "safety"
  | "identity"
  | "work"
  | "shelter";

export interface MigrantPhrase {
  id: string;
  category: PhraseCategory;
  text: Record<PhraseLang, string>;
}

export const PHRASE_CATEGORIES: Array<{
  id: PhraseCategory;
  zh: string;
  en: string;
}> = [
  { id: "medical", zh: "醫療", en: "Medical" },
  { id: "safety", zh: "安全", en: "Safety" },
  { id: "identity", zh: "身分", en: "Identity" },
  { id: "work", zh: "工作", en: "Work" },
  { id: "shelter", zh: "避難", en: "Shelter" },
];

export const MIGRANT_PHRASES: MigrantPhrase[] = [
  // ─── MEDICAL ───
  {
    id: "injured",
    category: "medical",
    text: {
      zh: "我受傷了",
      en: "I'm injured",
      vi: "Tôi bị thương",
      id: "Saya terluka",
      th: "ฉันบาดเจ็บ",
      fil: "Nasugatan ako",
    },
  },
  {
    id: "call-ambulance",
    category: "medical",
    text: {
      zh: "請叫救護車",
      en: "Please call an ambulance",
      vi: "Làm ơn gọi xe cứu thương",
      id: "Tolong panggil ambulans",
      th: "กรุณาเรียกรถพยาบาล",
      fil: "Pakitawag ang ambulansya",
    },
  },
  {
    id: "bleeding",
    category: "medical",
    text: {
      zh: "我在流血",
      en: "I'm bleeding",
      vi: "Tôi đang chảy máu",
      id: "Saya berdarah",
      th: "ฉันเลือดออก",
      fil: "Dumudugo ako",
    },
  },
  {
    id: "pregnant",
    category: "medical",
    text: {
      zh: "我懷孕了",
      en: "I'm pregnant",
      vi: "Tôi đang mang thai",
      id: "Saya hamil",
      th: "ฉันตั้งครรภ์",
      fil: "Buntis ako",
    },
  },
  {
    id: "allergy",
    category: "medical",
    text: {
      zh: "我有過敏",
      en: "I have allergies",
      vi: "Tôi bị dị ứng",
      id: "Saya punya alergi",
      th: "ฉันเป็นภูมิแพ้",
      fil: "May allergy ako",
    },
  },
  {
    id: "chronic",
    category: "medical",
    text: {
      zh: "我每天吃藥",
      en: "I take medicine daily",
      vi: "Tôi uống thuốc hàng ngày",
      id: "Saya minum obat setiap hari",
      th: "ฉันกินยาทุกวัน",
      fil: "Umiinom ako ng gamot araw-araw",
    },
  },
  {
    id: "cannot-breathe",
    category: "medical",
    text: {
      zh: "我呼吸困難",
      en: "I can't breathe well",
      vi: "Tôi khó thở",
      id: "Saya sesak napas",
      th: "ฉันหายใจลำบาก",
      fil: "Hirap akong huminga",
    },
  },
  {
    id: "where-hospital",
    category: "medical",
    text: {
      zh: "醫院在哪裡？",
      en: "Where is the hospital?",
      vi: "Bệnh viện ở đâu?",
      id: "Di mana rumah sakit?",
      th: "โรงพยาบาลอยู่ที่ไหน",
      fil: "Nasaan ang ospital?",
    },
  },

  // ─── SAFETY ───
  {
    id: "help-me",
    category: "safety",
    text: {
      zh: "救命！請幫我",
      en: "Help! Please help me",
      vi: "Cứu tôi với!",
      id: "Tolong! Bantu saya",
      th: "ช่วยด้วย! ช่วยฉันที",
      fil: "Saklolo! Tulungan ninyo ako",
    },
  },
  {
    id: "call-police",
    category: "safety",
    text: {
      zh: "請叫警察",
      en: "Please call the police",
      vi: "Làm ơn gọi cảnh sát",
      id: "Tolong panggil polisi",
      th: "กรุณาเรียกตำรวจ",
      fil: "Pakitawag ang pulis",
    },
  },
  {
    id: "trapped",
    category: "safety",
    text: {
      zh: "我被困住了",
      en: "I'm trapped",
      vi: "Tôi bị mắc kẹt",
      id: "Saya terjebak",
      th: "ฉันติดอยู่",
      fil: "Na-trap ako",
    },
  },
  {
    id: "fire",
    category: "safety",
    text: {
      zh: "失火了！",
      en: "Fire!",
      vi: "Cháy rồi!",
      id: "Kebakaran!",
      th: "ไฟไหม้!",
      fil: "Sunog!",
    },
  },
  {
    id: "earthquake",
    category: "safety",
    text: {
      zh: "地震了",
      en: "Earthquake",
      vi: "Động đất",
      id: "Gempa bumi",
      th: "แผ่นดินไหว",
      fil: "Lindol",
    },
  },
  {
    id: "lost",
    category: "safety",
    text: {
      zh: "我迷路了",
      en: "I'm lost",
      vi: "Tôi bị lạc",
      id: "Saya tersesat",
      th: "ฉันหลงทาง",
      fil: "Naligaw ako",
    },
  },
  {
    id: "need-translator",
    category: "safety",
    text: {
      zh: "我需要翻譯",
      en: "I need a translator",
      vi: "Tôi cần phiên dịch",
      id: "Saya butuh penerjemah",
      th: "ฉันต้องการล่าม",
      fil: "Kailangan ko ng tagasalin",
    },
  },
  {
    id: "call-1955",
    category: "safety",
    text: {
      zh: "請撥 1955",
      en: "Please call 1955",
      vi: "Làm ơn gọi 1955",
      id: "Tolong hubungi 1955",
      th: "กรุณาโทร 1955",
      fil: "Pakitawag ang 1955",
    },
  },

  // ─── IDENTITY ───
  {
    id: "my-name",
    category: "identity",
    text: {
      zh: "我的名字是",
      en: "My name is",
      vi: "Tên tôi là",
      id: "Nama saya",
      th: "ฉันชื่อ",
      fil: "Ako si",
    },
  },
  {
    id: "from-country",
    category: "identity",
    text: {
      zh: "我來自",
      en: "I'm from",
      vi: "Tôi đến từ",
      id: "Saya dari",
      th: "ฉันมาจาก",
      fil: "Galing ako sa",
    },
  },
  {
    id: "passport",
    category: "identity",
    text: {
      zh: "我的護照號碼是",
      en: "My passport number is",
      vi: "Số hộ chiếu của tôi là",
      id: "Nomor paspor saya",
      th: "หมายเลขพาสปอร์ตของฉันคือ",
      fil: "Ang numero ng pasaporte ko ay",
    },
  },
  {
    id: "arc",
    category: "identity",
    text: {
      zh: "我的居留證號碼是",
      en: "My ARC number is",
      vi: "Số thẻ cư trú (ARC) của tôi là",
      id: "Nomor ARC saya",
      th: "หมายเลข ARC ของฉันคือ",
      fil: "Ang ARC number ko ay",
    },
  },
  {
    id: "my-employer",
    category: "identity",
    text: {
      zh: "我的雇主是",
      en: "My employer is",
      vi: "Chủ của tôi là",
      id: "Majikan saya",
      th: "นายจ้างของฉันคือ",
      fil: "Ang amo ko ay",
    },
  },
  {
    id: "my-broker",
    category: "identity",
    text: {
      zh: "我的仲介是",
      en: "My broker is",
      vi: "Môi giới của tôi là",
      id: "Agen saya",
      th: "นายหน้าของฉันคือ",
      fil: "Ang agency ko ay",
    },
  },

  // ─── WORK ───
  {
    id: "not-paid",
    category: "work",
    text: {
      zh: "我沒有領到薪水",
      en: "I haven't been paid",
      vi: "Tôi chưa được trả lương",
      id: "Gaji saya belum dibayar",
      th: "ฉันยังไม่ได้รับเงินเดือน",
      fil: "Hindi pa ako sumasahod",
    },
  },
  {
    id: "passport-taken",
    category: "work",
    text: {
      zh: "我的護照被拿走了",
      en: "My passport was taken",
      vi: "Hộ chiếu của tôi bị giữ",
      id: "Paspor saya diambil",
      th: "พาสปอร์ตของฉันถูกยึด",
      fil: "Kinuha ang pasaporte ko",
    },
  },
  {
    id: "contact-office",
    category: "work",
    text: {
      zh: "請聯絡我的辦事處",
      en: "Please contact my representative office",
      vi: "Làm ơn liên lạc văn phòng đại diện",
      id: "Tolong hubungi kantor perwakilan saya",
      th: "กรุณาติดต่อสำนักงานตัวแทนของฉัน",
      fil: "Pakikontak ang aming tanggapan",
    },
  },
  {
    id: "want-change-employer",
    category: "work",
    text: {
      zh: "我想換雇主",
      en: "I want to change employer",
      vi: "Tôi muốn đổi chủ",
      id: "Saya mau ganti majikan",
      th: "ฉันต้องการเปลี่ยนนายจ้าง",
      fil: "Gusto kong magpalit ng amo",
    },
  },
  {
    id: "abused",
    category: "work",
    text: {
      zh: "我被虐待",
      en: "I'm being abused",
      vi: "Tôi bị ngược đãi",
      id: "Saya dianiaya",
      th: "ฉันถูกทำร้าย",
      fil: "Inaabuso ako",
    },
  },
  {
    id: "overworked",
    category: "work",
    text: {
      zh: "我的工時太長",
      en: "My working hours are too long",
      vi: "Giờ làm việc của tôi quá dài",
      id: "Jam kerja saya terlalu panjang",
      th: "ชั่วโมงทำงานของฉันยาวเกินไป",
      fil: "Masyadong mahaba ang oras ng trabaho ko",
    },
  },

  // ─── SHELTER ───
  {
    id: "where-shelter",
    category: "shelter",
    text: {
      zh: "避難所在哪裡？",
      en: "Where is the shelter?",
      vi: "Nơi trú ẩn ở đâu?",
      id: "Di mana tempat perlindungan?",
      th: "ศูนย์หลบภัยอยู่ที่ไหน",
      fil: "Nasaan ang evacuation center?",
    },
  },
  {
    id: "no-food",
    category: "shelter",
    text: {
      zh: "我沒有食物",
      en: "I have no food",
      vi: "Tôi không có thức ăn",
      id: "Saya tidak punya makanan",
      th: "ฉันไม่มีอาหาร",
      fil: "Wala akong pagkain",
    },
  },
  {
    id: "no-water",
    category: "shelter",
    text: {
      zh: "我沒有水",
      en: "I have no water",
      vi: "Tôi không có nước",
      id: "Saya tidak punya air",
      th: "ฉันไม่มีน้ำ",
      fil: "Wala akong tubig",
    },
  },
  {
    id: "no-sleep",
    category: "shelter",
    text: {
      zh: "我沒有地方睡",
      en: "I have no place to sleep",
      vi: "Tôi không có chỗ ngủ",
      id: "Saya tidak punya tempat tidur",
      th: "ฉันไม่มีที่นอน",
      fil: "Wala akong matutulugan",
    },
  },
  {
    id: "can-stay",
    category: "shelter",
    text: {
      zh: "我可以留在這裡嗎？",
      en: "Can I stay here?",
      vi: "Tôi có thể ở lại đây không?",
      id: "Bolehkah saya tinggal di sini?",
      th: "ฉันสามารถอยู่ที่นี่ได้ไหม",
      fil: "Pwede ba akong mag-stay dito?",
    },
  },
  {
    id: "charge-phone",
    category: "shelter",
    text: {
      zh: "我需要充電",
      en: "I need to charge my phone",
      vi: "Tôi cần sạc điện thoại",
      id: "Saya perlu mengecas HP",
      th: "ฉันต้องชาร์จมือถือ",
      fil: "Kailangan kong mag-charge ng phone",
    },
  },
];
