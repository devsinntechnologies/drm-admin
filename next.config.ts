import type { NextConfig } from "next";

const localApiHosts = ["localhost", "127.0.0.1"] as const;
const localApiPorts = ["3000", "3001", "3002", "4000", "4001"] as const;

const PROD_API_URL = "https://drm.devsinntechnologies.com";
const DEV_API_URL = "https://vendor.umazing.shop";

function resolvePublicApiUrl(): string {
  const explicit = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV === "production") return PROD_API_URL;
  return DEV_API_URL;
}

const publicApiUrl = resolvePublicApiUrl();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl,
    NEXT_PUBLIC_BASE_URL: publicApiUrl,
  },
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
