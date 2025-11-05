const withNextIntl = require('next-intl/plugin')(
  './src/i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    _next_intl_trailing_slash: 'false'
  },
  // Limitar el rastreo de archivos para evitar bucles infinitos en monorepo
  outputFileTracingExcludes: {
    '*': [
      'node_modules/**/@swc/core*',
      'node_modules/**/esbuild',
      'node_modules/**/@esbuild/**',
      'node_modules/**/webpack',
      'node_modules/**/rollup',
      'node_modules/**/turbo',
      // Excluir otros proyectos del monorepo
      '../../apps/web/**',
      '../../prisma/**',
      '../../scripts/**',
      '../../docs/**',
      '../../knowledge/**',
      '../../lib/**',
      '../../cliente_tecnico/**',
      '../../n8n-workflow-config.json',
      '../../ngrok-config.md',
      '../../*.md',
      '../../*.py',
      '../../*.bat',
      '../../*.ps1',
      '../../*.js',
      '../../*.txt',
      '../../*.db',
      '../../*.db-journal',
      '../../temp_*',
      '../../tmp_*',
    ]
  }
};

module.exports = withNextIntl(nextConfig);
