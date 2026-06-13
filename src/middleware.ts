import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Normalize /piece/[marque]/[ref] : redirect if ref contains uppercase or non-alphanumeric chars
  const match = pathname.match(/^\/piece\/([^/]+)\/([^/]+)$/);
  if (match) {
    const marque = match[1];
    const ref = match[2];
    const normalized = ref.toUpperCase().replace(/[^A-Z0-9]/g, "").toLowerCase();
    if (ref !== normalized && normalized.length > 0) {
      const url = request.nextUrl.clone();
      url.pathname = `/piece/${marque}/${normalized}`;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/piece/:marque/:ref"],
};
