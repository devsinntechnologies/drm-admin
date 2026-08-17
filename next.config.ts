import type { NextConfig } from "next";

const localApiHosts = ["localhost", "127.0.0.1"] as const;
const localApiPorts = ["3000", "3001", "3002", "4000", "4001"] as const;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...localApiHosts.flatMap((hostname) =>
        localApiPorts.map((port) => ({
          protocol: "http" as const,
          hostname,
          port,
        })),
      ),
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
