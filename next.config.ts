import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Pas d'en-tête « X-Powered-By: Next.js » (empreinte inutile pour un attaquant)
  poweredByHeader: false,
  async redirects() {
    return [
      // Ancienne page de recherche par lot, fusionnée dans le mode technicien.
      { source: "/recherche-lot", destination: "/technicien", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
