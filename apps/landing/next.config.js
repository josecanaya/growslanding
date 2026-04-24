const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo: evita que el trace de serverless incluya apps/web (árbol enorme) y
  // reduce fallos de micromatch en "Collecting build traces" (p. ej. en Vercel).
  experimental: {
    outputFileTracingExcludes: {
      '*': ['../web/**'],
    },
  },
};

module.exports = withNextIntl(nextConfig);
