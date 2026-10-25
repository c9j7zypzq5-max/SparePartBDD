import { NextRequest, NextResponse } from "next/server";
import { referenceSlug } from "@/lib/normalize";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guardAdmin(request);
  }

  // Normalize /piece/[marque]/[ref] : redirect if ref contains uppercase or non-alphanumeric chars
  const match = pathname.match(/^\/piece\/([^/]+)\/([^/]+)$/);
  if (match) {
    const [, marque, ref] = match;
    const normalized = referenceSlug(safeDecode(ref));
    if (ref !== normalized && normalized.length > 0) {
      const url = request.nextUrl.clone();
      url.pathname = `/piece/${marque}/${normalized}`;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

/** "11%2042%207" → "11 42 7" (sinon "%20" laisserait un "20" parasite dans la référence). */
function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Les pages /admin exposent des données internes : authentification HTTP
 * Basic avec ADMIN_USER (défaut "admin") / ADMIN_PASSWORD. Sans mot de passe
 * configuré, l'admin n'est accessible qu'en développement local.
 */
function guardAdmin(request: NextRequest): NextResponse {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("Not found", { status: 404 });
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));
  if (credentials) {
    const user = process.env.ADMIN_USER || "admin";
    // Les deux comparaisons sont toujours évaluées (pas de court-circuit).
    const userOk = constantTimeEqual(credentials.user, user);
    const passwordOk = constantTimeEqual(credentials.password, password);
    if (userOk && passwordOk) return NextResponse.next();
  }

  return new NextResponse("Authentification requise", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SparePartSearch admin", charset="UTF-8"' },
  });
}

function parseBasicAuth(header: string | null): { user: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const bytes = Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const sep = decoded.indexOf(":");
    if (sep < 0) return null;
    return { user: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
}

/** Comparaison sans sortie anticipée (le runtime Edge n'a pas crypto.timingSafeEqual). */
function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export const config = {
  matcher: ["/piece/:marque/:ref", "/admin/:path*"],
};
