import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drm.devsinntechnologies.com",
      },
    ],
  },
};

export default nextConfig;
