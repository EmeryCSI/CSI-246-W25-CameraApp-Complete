import type { Configuration } from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: Configuration) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
      "node-fetch": false,
    };
    return config;
  },
};

export default nextConfig;
