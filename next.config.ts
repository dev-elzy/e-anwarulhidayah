import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheStartUrl: false,
  dynamicStartUrl: false,
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  workboxOptions: {
    // Exclude /dashboard, /api, and /login from PWA navigation fallback / caching
    navigateFallbackDenylist: [/^\/dashboard/, /^\/api/, /^\/login/],
    runtimeCaching: [
      // 0. Handle Next.js App Router RSC payloads and APIs/Login to prevent unexpected responses
      {
        urlPattern: ({ request, url }) => {
          const isRSC = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
          return isRSC || url.pathname.startsWith("/api") || url.pathname.startsWith("/login");
        },
        handler: "NetworkFirst",
        options: {
          cacheName: "rsc-and-api-payloads",
          expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
          networkTimeoutSeconds: 3,
        },
      },
      // 1. Google Fonts stylesheets
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts-stylesheets",
        },
      },
      // 2. Google Fonts webfonts
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts-webfonts",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      // 3. Next.js static files (JS, CSS)
      {
        urlPattern: /\/_next\/static\/.+\.(?:js|css)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // 4. Static images and media
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // 5. Manifest and icons
      {
        urlPattern: /\/(?:manifest\.json|icons\/.*)$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "manifest-assets",
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Required for OpenNext Cloudflare Workers compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Exclude packages from server bundle that are either unused on server
  // or client-only (these would bloat the Cloudflare Worker script)
  outputFileTracingExcludes: {
    "*": [
      "node_modules/cloudinary/**",
      "node_modules/@libsql/**",
      "node_modules/html2pdf.js/**",
      "node_modules/html5-qrcode/**",
      "node_modules/canvas/**",
    ],
  },
  // Turbopack configuration
  turbopack: {},
};

export default withPWA(nextConfig);
