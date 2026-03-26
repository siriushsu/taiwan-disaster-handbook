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
  title: "我家附近的避難所在哪？ | Taiwan Emergency Handbook",
  description:
    "輸入地址，3 秒找到你家最近的避難收容所、防空洞、醫院和 AED。免費產生個人化防災手冊 PDF，所有資料在瀏覽器中處理，不會上傳。",
  keywords: [
    "防災",
    "避難所",
    "防空避難",
    "台灣",
    "地震",
    "颱風",
    "緊急準備",
    "disaster preparedness",
    "Taiwan",
  ],
  authors: [{ name: "Taiwan Family Emergency Handbook" }],
  openGraph: {
    title: "我家附近的避難所在哪？",
    description:
      "輸入地址，3 秒找到最近的避難收容所、防空洞、醫院和 AED — 還能產生你家專屬防災手冊 PDF。",
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
    title: "我家附近的避難所在哪？",
    description: "輸入地址，3 秒找到最近的避難所、防空洞、醫院和 AED。",
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
  name: "我家附近的避難所在哪？",
  description:
    "免費線上工具：輸入地址即可找到最近的避難所、防空洞、醫院和 AED，並產生個人化防災手冊 PDF。",
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
        {/* Google Analytics (gtag.js) */}
        <script
          defer
          data-ga="gtag"
          src="https://www.googletagmanager.com/gtag/js?id=G-6J1275K6C5"
        />
        <script
          defer
          data-ga="config"
          dangerouslySetInnerHTML={{
            __html:
              "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-6J1275K6C5');",
          }}
        />
        {/* Plausible Analytics — privacy-friendly, no cookies, 1KB script */}
        <script
          defer
          data-domain="disaster-handbook.vercel.app"
          src="https://plausible.io/js/script.js"
        />
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
