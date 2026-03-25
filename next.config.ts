import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
