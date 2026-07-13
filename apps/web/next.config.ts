import type { NextConfig } from 'next';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// The NestJS API does not enable CORS, so the browser talks to same-origin
// /api/* routes and Next.js proxies them to the backend server-side.
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/agent/:path*',
        destination: `${apiUrl}/agent/:path*`,
      },
      {
        source: '/api/health',
        destination: `${apiUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
