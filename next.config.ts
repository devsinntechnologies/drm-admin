import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3002",
      },
      {
        protocol: "https",
        hostname: "drm.devsinntechnologies.com",
      },
      {
        protocol: "https",
        hostname: "vendor.umazing.shop",
      },
    ],
  },
};

export default nextConfig;
