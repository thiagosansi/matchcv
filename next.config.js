/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['docx', 'pdf-parse'],
  },
  async headers() {
    // Prevent CDN caching for auth-gated pages so stale HTML is never served
    const noCacheHeaders = [
      { key: 'Cache-Control', value: 'no-store, max-age=0' },
    ];
    return [
      { source: '/profile', headers: noCacheHeaders },
      { source: '/results/preview', headers: noCacheHeaders },
      { source: '/analyze', headers: noCacheHeaders },
      { source: '/history', headers: noCacheHeaders },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom', 'pdf-parse'];
    }
    return config;
  },
};

module.exports = nextConfig;
