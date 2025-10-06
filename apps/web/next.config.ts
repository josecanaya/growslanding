import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  experimental: { 
    esmExternals: 'loose' 
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    };
    config.resolve.fallback = { 
      fs: false, 
      path: false 
    };
    return config;
  },
  async rewrites() {
    return [
      { 
        source: '/wasm/:path*', 
        destination: '/wasm/:path*' 
      }
    ];
  },
  // importante: asegurar que el directorio public este bien resuelto
  output: 'standalone',
  staticPageGenerationTimeout: 180,
  env: {
    NEXT_PUBLIC_WASM_PATH: '/wasm/',
  }
};

export default nextConfig;
