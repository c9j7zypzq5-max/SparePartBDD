import { buildOpenApiSpec } from "@/lib/openapi";
import { API_CORS_HEADERS } from "@/lib/api-auth";

export const runtime = "nodejs";

/** GET /api/v1/openapi.json — spécification OpenAPI 3.1 (publique, sans auth). */
export function GET() {
  return Response.json(buildOpenApiSpec(), {
    headers: { ...API_CORS_HEADERS, "Cache-Control": "public, max-age=3600" },
  });
}
