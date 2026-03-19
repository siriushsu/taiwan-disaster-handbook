# 台灣家庭防災手冊產生器 🇹🇼

**Taiwan Family Disaster Handbook Generator**

根據您的居住地點，自動產生個人化的家庭防災手冊，包含最近的避難場所、醫療設施及防災資訊。所有資料處理皆在瀏覽器端完成，不會上傳任何個人資訊。

Generate a personalized family disaster preparedness handbook based on your location in Taiwan. Includes nearby shelters, medical facilities, and disaster preparedness information. All data processing happens client-side -- your personal information never leaves your browser.

## Screenshot

> TODO: Add screenshot here

## Features | 功能特色

- **雙語介面 | Bilingual Interface** -- Full support for Traditional Chinese and English
- **個人化避難所 | Personalized Shelters** -- Automatically finds the nearest emergency shelters, air-raid shelters, and medical facilities based on your address
- **PDF 手冊產生 | PDF Generation** -- Generate a print-ready disaster handbook customized for your household
- **離線支援 | Offline Support** -- Works offline after initial load
- **隱私優先 | Privacy First** -- All processing happens in your browser; no data is sent to any server

## Tech Stack | 技術架構

- [Next.js](https://nextjs.org/) -- React framework
- [@react-pdf/renderer](https://react-pdf.org/) -- Client-side PDF generation
- [Leaflet](https://leafletjs.com/) -- Interactive maps
- [Tailwind CSS](https://tailwindcss.com/) -- Styling

## Getting Started | 快速開始

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing | 貢獻

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- Reporting data errors (shelter locations, medical facilities)
- Contributing translations
- Contributing code

## Data Sources | 資料來源

- **避難場所 | Shelters** -- [內政部消防署開放資料](https://data.gov.tw/) (Ministry of the Interior open data)
- **醫療設施 | Medical Facilities** -- [衛生福利部開放資料](https://data.gov.tw/) (Ministry of Health and Welfare open data)
- **地圖 | Maps** -- [OpenStreetMap](https://www.openstreetmap.org/)

## License | 授權

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
