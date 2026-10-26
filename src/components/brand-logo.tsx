"use client";

import { useEffect, useRef, useState } from "react";
import { getBrandLogoUrl } from "@/lib/brand-logos";

export function BrandLogo({
  slug,
  name,
  size = 32,
}: {
  slug: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const logoUrl = getBrandLogoUrl(slug);

  useEffect(() => {
    // Une image en échec avant l'hydratation n'a pas déclenché onError
    // (proxy d'entreprise, bloqueur…) : on vérifie son état au montage.
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!logoUrl || failed) {
    return (
      <span
        style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
        className="inline-flex flex-shrink-0 select-none items-center justify-center rounded bg-zinc-100 font-semibold text-zinc-600"
        aria-hidden="true"
      >
        {name[0]?.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      ref={imgRef}
      src={logoUrl}
      alt={`Logo ${name}`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="flex-shrink-0 object-contain"
    />
  );
}
