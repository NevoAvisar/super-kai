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
  // QA (routing): URLs people (and old links) commonly try. They used to 404; now they land on the right screen.
  // HE: כתובות נפוצות שהחזירו 404 – מפנות עכשיו למסך הנכון.
  async redirects() {
    return [
      { source: "/signup", destination: "/login?mode=signup", permanent: true },
      { source: "/register", destination: "/login?mode=signup", permanent: true },
      { source: "/signin", destination: "/login", permanent: true },
      { source: "/sign-in", destination: "/login", permanent: true },
      { source: "/account", destination: "/orders", permanent: false },
      { source: "/my-orders", destination: "/orders", permanent: true },
      { source: "/menu", destination: "/catalog", permanent: true },
      { source: "/shop", destination: "/catalog", permanent: true },
      { source: "/products", destination: "/catalog", permanent: true },
      { source: "/dashboard", destination: "/admin", permanent: false },
    ];
  },
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
