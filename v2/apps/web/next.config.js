/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    // In dev, proxy /api calls to the local API server
    // In production, NEXT_PUBLIC_API_URL points directly to api.only-posts.com
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.API_PROXY_TARGET || 'http://localhost:5055'}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
