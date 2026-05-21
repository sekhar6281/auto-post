/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Prevent embedding in iframes (clickjacking protection)
  { key: "X-Frame-Options",          value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options",   value: "nosniff" },
  // XSS filter for older browsers
  { key: "X-XSS-Protection",         value: "1; mode=block" },
  // Only send origin on cross-origin requests (no full URL)
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  // Lock down browser features we don't need
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Force HTTPS for 2 years (production only — harmless on HTTP dev)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevent DNS prefetch leaking URLs
  { key: "X-DNS-Prefetch-Control",   value: "on" },
];

const nextConfig = {
  headers: async () => [
    {
      // Apply security headers to every route
      source: "/(.*)",
      headers: securityHeaders,
    },
    {
      // On sign-out, instruct the browser to wipe cookies, storage, and cache
      // for this origin — the nuclear privacy option
      source: "/api/auth/signout",
      headers: [
        { key: "Clear-Site-Data", value: '"cookies", "storage", "cache"' },
      ],
    },
  ],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.licdn.com"     },
      { protocol: "https", hostname: "res.cloudinary.com"  },
    ],
  },
};

module.exports = nextConfig;
