import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "missing address" }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: "geocoding unavailable" },
      { status: 503 },
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=tw&language=zh-TW&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();

    if (data.status === "OK" && data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      const lat = Math.round(loc.lat * 1e6) / 1e6;
      const lng = Math.round(loc.lng * 1e6) / 1e6;
      if (lat >= 20 && lat <= 27 && lng >= 118 && lng <= 123) {
        return NextResponse.json({
          lat,
          lng,
          formattedAddress: data.results[0].formatted_address || "",
        });
      }
    }

    return NextResponse.json({ error: "not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "geocoding failed" }, { status: 502 });
  }
}
