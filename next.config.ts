import type { NextConfig } from "next";

const localApiHosts = ["localhost", "127.0.0.1"] as const;
const localApiPorts = ["3000", "3001", "3002", "4000", "4001", "6000"] as const;

const PROD_API_URL = "https://drm.devsinntechnologies.com";
const DEV_API_URL = "https://vendor.umazing.shop";
/** Same-origin proxy path → Nest on 127.0.0.1:6000 (avoids browser localhost/CORS issues). */
const LOCAL_PROXY_API_URL = "/backend";

function resolvePublicApiUrl(): string {
  const explicit = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).replace(/\/+$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV === "production") return PROD_API_URL;
  if (process.env.NODE_ENV !== "production") return LOCAL_PROXY_API_URL;
  return DEV_API_URL;
}

function resolveUpstreamApiUrl(): string {
  const upstream = (
    process.env.API_PROXY_TARGET ||
    process.env.BACKEND_URL ||
    "http://127.0.0.1:6000"
  ).replace(/\/+$/, "");
  return upstream;
}

const publicApiUrl = resolvePublicApiUrl();
const upstreamApiUrl = resolveUpstreamApiUrl();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl,
    NEXT_PUBLIC_BASE_URL: publicApiUrl,
  },
  async rewrites() {
    // Browser calls /backend/* on the admin origin; Next proxies to Nest.
    return [
      {
        source: "/backend/:path*",
        destination: `${upstreamApiUrl}/:path*`,
      },
    ];
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
