import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vendor.umazing.shop",
      },
    ],
  },
};

export default nextConfig;
