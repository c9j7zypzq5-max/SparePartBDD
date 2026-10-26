import { NextRequest } from "next/server";
import { applyLifecycleReport } from "@/lib/lifecycle-pipeline";
import type { LifecycleReportPayload } from "@/lib/lifecycle-types";
import { requireApiKey } from "@/lib/api-auth";

export const runtime = "nodejs";

/**
 * Reçoit le rapport du contrôle hebdomadaire (script Mac mini) et applique
 * la politique de mise à jour des statuts — voir lifecycle-pipeline.ts.
 */
export async function POST(req: NextRequest) {
  const authError = requireApiKey(req);
  if (authError) return authError;

  let payload: LifecycleReportPayload;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!Array.isArray(payload.results) || payload.results.length === 0) {
    return Response.json(
      { error: "results[] vide ou absent" },
      { status: 400 },
    );
  }
  if (!payload.source) {
    return Response.json({ error: "source manquante" }, { status: 400 });
  }

  const result = await applyLifecycleReport(payload.results, payload.source);

  return Response.json(result, {
    status: result.errors.length > 0 ? 207 : 200,
  });
}
