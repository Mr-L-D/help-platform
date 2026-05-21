import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@help-platform/shared', '@help-platform/database'],

  // CORS 头，允许 H5 / 小程序等跨域调用 API
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
