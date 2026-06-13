import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getPartDetail } from "@/lib/queries";

export const runtime = "nodejs";

type Params = Promise<{ marque: string; ref: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { marque, ref } = await params;
  const detail = await getPartDetail(marque, ref);
  if (!detail) return new Response("Not found", { status: 404 });

  const { part, manufacturer } = detail;
  const statusLabel =
    part.status === "active" ? "✓ Fabriquée" : part.status === "obsolete" ? "✗ Obsolète" : "Statut inconnu";
  const statusBg =
    part.status === "active" ? "#dcfce7" : part.status === "obsolete" ? "#fee2e2" : "#f1f5f9";
  const statusColor =
    part.status === "active" ? "#15803d" : part.status === "obsolete" ? "#b91c1c" : "#64748b";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0f172a",
          padding: "48px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#60a5fa",
              fontSize: "22px",
              fontWeight: 600,
            }}
          >
            {manufacturer.name}
          </div>
          <div
            style={{
              color: "white",
              fontSize: "52px",
              fontWeight: 800,
              fontFamily: "monospace",
              letterSpacing: "-1px",
              lineHeight: 1.1,
            }}
          >
            {part.referenceRaw}
          </div>
          <div
            style={{
              color: "#94a3b8",
              fontSize: "24px",
              maxWidth: "800px",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
            }}
          >
            {part.name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              background: statusBg,
              color: statusColor,
              fontSize: "20px",
              fontWeight: 600,
              padding: "6px 20px",
              borderRadius: "999px",
            }}
          >
            {statusLabel}
          </div>
          <div
            style={{
              color: "#475569",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            SparePart<span style={{ color: "#3b82f6" }}>Search</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
