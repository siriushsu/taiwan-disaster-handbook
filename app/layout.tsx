import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

const siteUrl = "https://disaster-handbook.vercel.app";

export const metadata: Metadata = {
  title: "台灣家庭防災手冊產生器 | Taiwan Family Emergency Handbook",
  description:
    "免費產生個人化防災手冊 PDF。包含最近避難所、防空避難處、醫療院所、緊急聯絡、物資清單與情境應對指南。所有資料在瀏覽器中處理，不會上傳。",
  keywords: ["防災", "避難所", "防空避難", "台灣", "地震", "颱風", "緊急準備", "disaster preparedness", "Taiwan"],
  authors: [{ name: "Taiwan Family Emergency Handbook" }],
  openGraph: {
    title: "台灣家庭防災手冊產生器",
    description: "輸入地址，立即產生你家專屬的防災手冊 PDF — 最近避難所、集合點、緊急電話、物資清單一次搞定。",
    url: siteUrl,
    siteName: "台灣家庭防災手冊",
    locale: "zh_TW",
    type: "website",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "台灣家庭防災手冊",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "台灣家庭防災手冊產生器",
    description: "輸入地址，立即產生你家專屬的防災手冊 PDF。",
  },
  metadataBase: new URL(siteUrl),
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "防災手冊",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "台灣家庭防災手冊產生器",
  description:
    "免費線上工具：輸入地址即可產生個人化防災手冊 PDF，包含最近避難所、防空避難處、醫療院所、緊急聯絡資訊與物資清單。",
  url: siteUrl,
  applicationCategory: "UtilityApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TWD",
  },
  inLanguage: "zh-TW",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0D7377" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Plausible Analytics — privacy-friendly, no cookies, 1KB script */}
        <script defer data-domain="disaster-handbook.vercel.app" src="https://plausible.io/js/script.js" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${notoSansTC.variable} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <PWARegister />
      </body>
    </html>
  );
}
