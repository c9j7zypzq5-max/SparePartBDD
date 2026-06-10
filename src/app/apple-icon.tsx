import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Icône d'écran d'accueil iOS : même monogramme que le favicon, en grand.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          borderRadius: 36,
          color: "#ffffff",
          fontSize: 88,
          fontWeight: 700,
        }}
      >
        SP
      </div>
    ),
    size,
  );
}
