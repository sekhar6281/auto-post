/** @type {import('next').NextConfig} */

// ── Content-Security-Policy ────────────────────────────────────────────────
// Restricts what resources the browser will load for this site.
// 'unsafe-inline' on script/style is required by Next.js hydration and
// Tailwind CSS. A nonce-based CSP would remove that but requires
// per-request server-side nonce injection — this is a strong baseline.
const cspDirectives = [
  "default-src 'self'",
  // Next.js runtime + Tailwind needs inline scripts/styles
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // Images: our origin + LinkedIn profile photos + Cloudinary media
  "img-src 'self' data: blob: https://media.licdn.com https://res.cloudinary.com",
  // Video/audio from Cloudinary
  "media-src 'self' blob: https://res.cloudinary.com",
  // API calls: our origin + Cloudinary upload API
  "connect-src 'self' https://api.cloudinary.com https://upload.cloudinary.com",
  // Fonts: self only
  "font-src 'self'",
  // Absolutely no plugins (Flash, Java, etc.)
  "object-src 'none'",
  // No iframes allowed — belt-and-suspenders with X-Frame-Options
  "frame-src 'none'",
  "frame-ancestors 'none'",
  // Restrict <base> tag to prevent base-URL hijacking
  "base-uri 'self'",
  // Form submissions may only go to our own origin or LinkedIn OAuth
  "form-action 'self' https://www.linkedin.com",
  // Upgrade any accidental http:// subresource requests to https://
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Prevent embedding in iframes (clickjacking protection)
  { key: "X-Frame-Options",           value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options",    value: "nosniff" },
  // XSS filter for older browsers
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  // Only send origin on cross-origin requests (no full URL)
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  // Lock down browser features we don't need
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Force HTTPS for 2 years (production only — harmless on HTTP dev)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable DNS prefetch — prevents leaking user-visited URLs to DNS resolvers
  { key: "X-DNS-Prefetch-Control",    value: "off" },
  // Comprehensive Content Security Policy
  { key: "Content-Security-Policy",   value: cspDirectives },
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
      { protocol: "https", hostname: "media.licdn.com"    },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;
