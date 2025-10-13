import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: [],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true
    };
    
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
      }
    ];
  },
  staticPageGenerationTimeout: 180,
  env: {
    NEXT_PUBLIC_WASM_PATH: '/wasm/',
  }
};

export default nextConfig;
