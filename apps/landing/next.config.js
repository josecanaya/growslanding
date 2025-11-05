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
  // Configurar el root del tracing para evitar rastrear todo el monorepo
  outputFileTracingRoot: path.join(__dirname),
  // Deshabilitar el rastreo experimental para evitar stack overflow
  experimental: {
    outputFileTracingIncludes: {
      // Solo incluir archivos de la app landing, nada más
      '/**': ['./apps/landing/**'],
    },
    outputFileTracingExcludes: {
      // Excluir todo lo que pueda causar recursión
      '/**': [
        '**/node_modules/**',
        '**/.next/**',
        '**/apps/web/**',
        '**/apps/**/apps/**',
        '**/prisma/**',
        '**/migrations/**',
      ],
    },
  },
};

module.exports = withNextIntl(nextConfig);
