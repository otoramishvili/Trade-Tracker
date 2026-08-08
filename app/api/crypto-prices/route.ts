import { NextRequest, NextResponse } from "next/server";
import { getCryptoPrices } from "@/lib/coingecko";

export async function GET(request: NextRequest) {
  const symbols = (request.nextUrl.searchParams.get("symbols") || "").split(",");
  try {
    const result = await getCryptoPrices(symbols);
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" } });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Live prices are unavailable" }, { status: 502 });
  }
}
