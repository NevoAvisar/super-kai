"use client";

import Image, { type ImageLoader } from "next/image";
import { useState } from "react";

const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes("?") ? "&" : "?"}w=${width}&q=${quality ?? 70}&fit=crop&crop=entropy&ar=1:1&auto=format`;

/**
 * Small square photo for cart / checkout lines.
 * QA fix: a photo that fails to load (CDN down, removed Unsplash photo, offline)
 * used to show the browser's broken-image icon with the alt text spilling over
 * the thumbnail. It now falls back to the category icon, like ProductImage does.
 * HE: תמונה שלא נטענת מציגה עכשיו את אייקון הקטגוריה במקום תמונה שבורה.
 */
export function CartThumb({ src, alt, icon, size = 64 }: { src?: string | null; alt: string; icon: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative shrink-0 overflow-hidden rounded-2xl bg-brand-50" style={{ width: size, height: size }}>
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          loader={src.startsWith("https://images.unsplash.com/") ? unsplashLoader : undefined}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-2xl" aria-hidden>{icon}</span>
      )}
    </div>
  );
}
