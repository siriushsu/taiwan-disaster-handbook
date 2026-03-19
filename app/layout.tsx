import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const siteUrl = "https://disaster-handbook.vercel.app";

export const metadata: Metadata = {
  title: "台灣家庭防災手冊產生器 | Taiwan Disaster Handbook",
  description:
    "免費產生個人化防災手冊 PDF。包含最近避難所、防空避難處、醫療院所、緊急聯絡、物資清單與情境應對指南。所有資料在瀏覽器中處理，不會上傳。",
  keywords: ["防災", "避難所", "防空避難", "台灣", "地震", "颱風", "緊急準備", "disaster preparedness", "Taiwan"],
  authors: [{ name: "Taiwan Disaster Handbook" }],
  openGraph: {
    title: "台灣家庭防災手冊產生器",
    description: "輸入地址，立即產生你家專屬的防災手冊 PDF — 最近避難所、集合點、緊急電話、物資清單一次搞定。",
    url: siteUrl,
    siteName: "台灣家庭防災手冊",
    locale: "zh_TW",
    type: "website",
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#334155" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <PWARegister />
      </body>
    </html>
  );
}
