/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SEO/perf: serve next-gen image formats by default (smaller LCP payloads).
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Security + SEO baseline headers. Helps Core Web Vitals trust signals and
  // prevents the page from being framed/clickjacked.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
