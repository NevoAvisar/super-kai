"use client";

import Image, { type ImageLoader } from "next/image";

const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes("?") ? "&" : "?"}w=${width}&q=${quality ?? 70}&fit=crop&crop=entropy&ar=1:1&auto=format`;

export function CartThumb({ src, alt, icon, size = 64 }: { src?: string | null; alt: string; icon: string | null; size?: number }) {
  return (
    <div className="relative shrink-0 overflow-hidden rounded-2xl bg-brand-50" style={{ width: size, height: size }}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          loader={src.startsWith("https://images.unsplash.com/") ? unsplashLoader : undefined}
          className="object-cover"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-2xl" aria-hidden>{icon}</span>
      )}
    </div>
  );
}
