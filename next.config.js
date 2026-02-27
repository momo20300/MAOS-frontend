const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix: prevent Next.js from scanning the entire C:\ drive
  outputFileTracingRoot: path.join(__dirname, './'),
  // All data goes through backend (port 4000) — no direct ERPNext access
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    // Prevent Watchpack from scanning outside the project directory
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        'C:\\pagefile.sys',
        'C:\\hiberfil.sys',
        'C:\\DumpStack.log.tmp',
        'C:\\swapfile.sys',
      ],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
