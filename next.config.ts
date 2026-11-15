import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Product photos live in /public/products and carry a ?v=<mtime> cache-buster.
    localPatterns: [{ pathname: "/products/**" }, { pathname: "/**", search: "" }],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  poweredByHeader: false,
  // QA (security): baseline headers. No CSP yet — GSAP inline styles and the Unsplash CDN need a tuned policy.
  // HE: כותרות אבטחה בסיסיות – מניעת הטמעה ב-iframe (clickjacking), sniffing ודליפת referrer.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // The admin screens must never be indexed, even if a link leaks.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
