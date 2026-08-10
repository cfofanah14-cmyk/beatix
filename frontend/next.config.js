/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent ECONNRESET when Google Fonts unreachable at build time
  optimizeFonts: false,

  // Compress responses
  compress: true,

  // Image optimisation
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          // Allow camera + mic for scanner and voice help
          { key: 'Permissions-Policy',         value: 'camera=*, microphone=*' },
        ],
      },
      // Service worker — must be served with no-cache so updates are detected
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',  value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // Manifest
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
          { key: 'Content-Type',  value: 'application/manifest+json' },
        ],
      },
      // Icons — long cache
      {
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  experimental: {},
}

module.exports = nextConfig
