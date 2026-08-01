import { NextRequest, NextResponse } from "next/server";
import { BASE_URL } from "@/lib/constant";

/**
 * Server-side proxy for public catalog reads.
 * Browser calls send Origin (e.g. http://localhost:3000), which the public API
 * rejects unless listed in allowedOrigins. Proxying omits Origin so admin preview works.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessId: string; path?: string[] }> },
) {
  const { businessId, path = [] } = await context.params;

  if (!businessId || !/^[0-9a-fA-F-]{36}$/.test(businessId)) {
    return NextResponse.json({ message: "Invalid businessId" }, { status: 400 });
  }

  const suffix = path.length ? `/${path.join("/")}` : "";
  const upstream = new URL(`${BASE_URL}/public/catalog/${businessId}${suffix}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  try {
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: { accept: "*/*" },
      cache: "no-store",
    });

    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // keep raw text
    }

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Failed to reach public catalog",
      },
      { status: 502 },
    );
  }
}
