import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "台灣家庭防災手冊 — 輸入地址，3 秒找到附近避難所";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#f6f5f4",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: "#0d9488",
          display: "flex",
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: "rgba(0,0,0,0.9)",
          marginBottom: 8,
          display: "flex",
        }}
      >
        我家附近的避難所在哪？
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 24,
          color: "rgba(0,0,0,0.5)",
          marginBottom: 36,
          display: "flex",
        }}
      >
        輸入地址，3 秒找到避難收容所、防空洞、醫院和 AED
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 36,
        }}
      >
        {[
          { num: "6,300+", label: "避難收容所" },
          { num: "71,000+", label: "防空避難設施" },
          { num: "16,900+", label: "醫療院所" },
          { num: "15,000+", label: "AED" },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "#ffffff",
              borderRadius: 12,
              padding: "16px 28px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#0d9488",
                display: "flex",
              }}
            >
              {stat.num}
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(0,0,0,0.5)",
                display: "flex",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#0d9488",
          borderRadius: 12,
          padding: "14px 32px",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: "#ffffff",
            fontWeight: 600,
            display: "flex",
          }}
        >
          免費產生你家的防災手冊 PDF
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          display: "flex",
          gap: 20,
          fontSize: 15,
          color: "rgba(0,0,0,0.3)",
        }}
      >
        <span style={{ display: "flex" }}>免費開源</span>
        <span style={{ display: "flex" }}>·</span>
        <span style={{ display: "flex" }}>資料不上傳</span>
        <span style={{ display: "flex" }}>·</span>
        <span style={{ display: "flex" }}>每週自動更新</span>
      </div>
    </div>,
    { ...size },
  );
}
