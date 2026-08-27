import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: [],
  serverExternalPackages: ['@cursor/sdk'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  turbopack: {},
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /web-ifc/,
        message: /Critical dependency: require function is used in a way/,
      },
    ];
    
    if (!isServer) {
      config.resolve.fallback = { 
        fs: false, 
        path: false 
      };
    }
    
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/wasm/:path*',
        destination: '/wasm/:path*'
      },
      // OAuth discovery para clientes MCP (ChatGPT). Next ignora carpetas con punto,
      // así que servimos los .well-known vía rewrite a rutas /api normales.
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/oauth/metadata/authorization-server',
      },
      {
        source: '/.well-known/oauth-authorization-server/:path*',
        destination: '/api/oauth/metadata/authorization-server',
      },
      {
        source: '/.well-known/oauth-protected-resource',
        destination: '/api/oauth/metadata/protected-resource',
      },
      {
        source: '/.well-known/oauth-protected-resource/:path*',
        destination: '/api/oauth/metadata/protected-resource',
      },
    ];
  },
  staticPageGenerationTimeout: 180,
  env: {
    NEXT_PUBLIC_WASM_PATH: '/wasm/',
  }
};

export default nextConfig;
