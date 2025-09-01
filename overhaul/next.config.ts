import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export for now - use regular deployment
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure for potential GitHub Pages deployment later
  // basePath: process.env.NODE_ENV === 'production' ? '/My-Guitar-Website' : '',
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/My-Guitar-Website/' : '',
};

export default nextConfig;
