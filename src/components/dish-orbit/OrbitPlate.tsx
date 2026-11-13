"use client";

import Image, { type ImageLoader } from "next/image";

/** Square crop from Unsplash's CDN so the photo fills the round plate. */
const squareUnsplash: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes("?") ? "&" : "?"}w=${width}&q=${quality ?? 80}&fit=crop&crop=entropy&ar=1:1&auto=format`;

/** A ceramic plate with the dish photo sitting in its well. */
export function OrbitPlate({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="relative h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#f3eee6_62%,#e6ddd0)] shadow-[0_50px_90px_-40px_rgba(50,30,10,0.55),0_8px_20px_-10px_rgba(50,30,10,0.25)]">
      {/* inner rim */}
      <div className="absolute inset-[5.5%] rounded-full shadow-[inset_0_2px_6px_rgba(60,40,20,0.18),inset_0_-1px_2px_rgba(255,255,255,0.9)]" />
      {/* the food */}
      <div className="absolute inset-[11%] overflow-hidden rounded-full shadow-[0_0_0_1px_rgba(60,40,20,0.06)]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 38vw, 70vw"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          loader={src.startsWith("https://images.unsplash.com/") ? squareUnsplash : undefined}
          className="object-cover"
          draggable={false}
        />
      </div>
      {/* glaze highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.45),transparent_42%)]" />
    </div>
  );
}

/** Kai's monogram plate for the welcome slide. */
export function MonogramPlate() {
  return (
    <div className="relative h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#f3eee6_62%,#e6ddd0)] shadow-[0_50px_90px_-40px_rgba(50,30,10,0.55),0_8px_20px_-10px_rgba(50,30,10,0.25)]">
      <div className="absolute inset-[5.5%] rounded-full shadow-[inset_0_2px_6px_rgba(60,40,20,0.18),inset_0_-1px_2px_rgba(255,255,255,0.9)]" />
      <div className="absolute inset-[16%] rounded-full border border-dashed border-[color-mix(in_oklab,var(--accent)_40%,transparent)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center [container-type:inline-size]">
        <span className="font-display text-[6cqw] font-bold tracking-[0.3em] text-muted">סופר</span>
        <span className="font-display text-[30cqw] font-black leading-[0.9] text-[color-mix(in_oklab,var(--accent)_85%,black)]">
          קאי
        </span>
        <span className="mt-[2cqw] text-[4cqw] font-medium tracking-wide text-muted">מעדנייה ביתית · אוכל מוכן</span>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.45),transparent_42%)]" />
    </div>
  );
}
