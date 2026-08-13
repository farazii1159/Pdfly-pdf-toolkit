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

  webpack: (config) => {
    config.resolve.alias['@'] = __dirname;
    return config;
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(nextConfig, {
  org: 'pdfly',
  project: 'javascript-nextjs',

  silent: !process.env.CI,

  widenClientFileUpload: true,

  tunnelRoute: '/monitoring',

  automaticVercelMonitors: true,

  webpack: {
    automaticVercelMonitors: true,

    treeshake: {
      removeDebugLogging: true,
    },
  },
});