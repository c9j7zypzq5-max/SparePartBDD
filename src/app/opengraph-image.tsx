import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "SparePartSearch — pièces industrielles et informatiques par référence";

// Image de partage (réseaux sociaux, messageries) : reprend le hero sombre.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(37,99,235,0.45), transparent)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
          }}
        >
          <div style={{ display: "flex", fontSize: 88, fontWeight: 700 }}>
            <span style={{ color: "#ffffff" }}>SparePart</span>
            <span style={{ color: "#60a5fa" }}>Search</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              color: "#a1a1aa",
              textAlign: "center",
            }}
          >
            Statut de fabrication, remplacement officiel, vendeurs et prix.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
