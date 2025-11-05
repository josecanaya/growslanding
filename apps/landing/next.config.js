const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    _next_intl_trailing_slash: 'false'
  },
  // Usar standalone output para evitar el rastreo completo de archivos
  // Esto evita el stack overflow en monorepos complejos
  output: 'standalone',
};

module.exports = withNextIntl(nextConfig);
