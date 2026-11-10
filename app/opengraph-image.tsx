import { ImageResponse } from "next/og";

export const alt = "AGRIVA — Digital tools for Bangladesh agriculture";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "76px", background: "linear-gradient(135deg, #103f2b 0%, #145b3c 58%, #6b8f36 100%)", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "76px", height: "76px", borderRadius: "22px", background: "#d9ed9d", color: "#103f2b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>🌱</div>
          <div style={{ fontSize: "54px", fontWeight: 800, letterSpacing: "2px" }}>AGRIVA</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "980px" }}>
          <div style={{ fontSize: "54px", fontWeight: 800, lineHeight: 1.2 }}>কৃষির প্রতিটি ধাপে আপনার পাশে</div>
          <div style={{ fontSize: "28px", color: "#e4f1d1" }}>Agriculture · Knowledge · Marketplace · Digital tools</div>
        </div>
        <div style={{ display: "flex", fontSize: "24px", color: "#e4f1d1" }}>agriva.com.bd</div>
      </div>
    ),
    { ...size }
  );
}
