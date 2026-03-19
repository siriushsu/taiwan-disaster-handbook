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
          background: "#1e293b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 16, display: "flex" }}>
          🛡️ ✓
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            marginBottom: 16,
            display: "flex",
          }}
        >
          台灣家庭防災手冊
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#94a3b8",
            marginBottom: 24,
            display: "flex",
          }}
        >
          Taiwan Family Emergency Handbook
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#60a5fa",
            display: "flex",
          }}
        >
          輸入地址 → 產生你的防災手冊 PDF
        </div>
      </div>
    ),
    { ...size }
  );
}
