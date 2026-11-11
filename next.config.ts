import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Product photos live in /public/products and carry a ?v=<mtime> cache-buster.
    localPatterns: [{ pathname: "/products/**" }, { pathname: "/**", search: "" }],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
