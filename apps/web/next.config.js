/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@dhanam/shared', '@dhanam/ui'],

  env: {
    // Use production URLs as defaults (these are baked at build time)
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.dhan.am/v1',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'https://app.dhan.am',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.dhan.am',
    NEXT_PUBLIC_OIDC_ISSUER: process.env.NEXT_PUBLIC_OIDC_ISSUER,
    NEXT_PUBLIC_OIDC_CLIENT_ID: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
    NEXT_PUBLIC_JANUA_API_URL: process.env.NEXT_PUBLIC_JANUA_API_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
