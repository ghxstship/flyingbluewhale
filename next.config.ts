import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      // Portal URL migration: /[slug]/[persona]/* → /p/[slug]/[persona]/*
      ...['artist', 'client', 'guest', 'sponsor', 'production', 'vendor', 'crew'].flatMap(
        (persona) => [
          {
            source: `/:slug/${persona}`,
            destination: `/p/:slug/${persona}`,
            permanent: true,
          },
          {
            source: `/:slug/${persona}/:path*`,
            destination: `/p/:slug/${persona}/:path*`,
            permanent: true,
          },
        ]
      ),
      // Mobile URL migration: /compvss/* → /m/*
      { source: '/compvss', destination: '/m', permanent: true },
      { source: '/compvss/:path*', destination: '/m/:path*', permanent: true },
      // Personal shell migration: /dashboard → /me
      { source: '/dashboard', destination: '/me', permanent: true },
      // Schedule rename: /console/master-schedule → /console/schedule
      { source: '/console/master-schedule', destination: '/console/schedule', permanent: true },
      { source: '/console/master-schedule/:path*', destination: '/console/schedule/:path*', permanent: true },
    ];
  },
  async headers() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : '*.supabase.co';

    // Allowed CORS origins — restrict to known domains in production
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ?? 'https://gvteway.com,https://atlvs.com,https://compvss.com';

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",  // unsafe-inline required for Next.js inline scripts; upgrade to nonce-based when ready
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ]
      },
      {
        source: '/api/v1/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins.split(',')[0] || 'https://gvteway.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Request-ID' },
          { key: 'Access-Control-Expose-Headers', value: 'X-Request-ID' },
          { key: 'Vary', value: 'Origin' },
        ],
      }
    ];
  }
};

export default nextConfig;
