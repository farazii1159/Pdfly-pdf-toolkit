/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  serverExternalPackages: ['pdf-parse'],

  allowedDevOrigins: [
    '192.168.56.1',
    'localhost',
  ],
};

module.exports = nextConfig;