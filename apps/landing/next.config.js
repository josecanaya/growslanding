const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
);

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    _next_intl_trailing_slash: 'false'
  },
  // Configurar el root del tracing SOLO para apps/landing
  // Esto evita que Next.js rastree todo el monorepo
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = withNextIntl(nextConfig);
