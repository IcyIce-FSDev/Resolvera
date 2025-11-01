import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Enable gzip compression
  compress: true,

  // API request size limits for DoS prevention
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb', // Limit request body size
    },
  },

  // Output standalone for optimized deployments
  output: 'standalone',
};

export default nextConfig;
