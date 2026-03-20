import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "台灣家庭防災手冊";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0D7377 0%, #065A5C 100%)",
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
        {/* Decorative top-right circle */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
          }}
        />
        {/* Decorative bottom-left circle */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            display: "flex",
          }}
        />

        {/* Icon row */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {["🏠", "📋", "🗺️"].map((emoji, i) => (
            <div
              key={i}
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 12,
            display: "flex",
            letterSpacing: "-0.02em",
          }}
        >
          台灣家庭防災手冊
        </div>

        {/* English subtitle */}
        <div
          style={{
            fontSize: 26,
            color: "rgba(255,255,255,0.7)",
            marginBottom: 32,
            display: "flex",
          }}
        >
          Taiwan Family Emergency Handbook
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 999,
            padding: "14px 36px",
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <div style={{ fontSize: 24, color: "#ffffff", fontWeight: 600, display: "flex" }}>
            輸入地址
          </div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", display: "flex" }}>→</div>
          <div style={{ fontSize: 24, color: "#E8704A", fontWeight: 600, display: "flex" }}>
            產生你家的防災手冊 PDF
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            display: "flex",
            gap: 24,
            fontSize: 16,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span style={{ display: "flex" }}>免費</span>
          <span style={{ display: "flex" }}>·</span>
          <span style={{ display: "flex" }}>開源</span>
          <span style={{ display: "flex" }}>·</span>
          <span style={{ display: "flex" }}>資料不上傳</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
