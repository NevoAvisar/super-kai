import { NextResponse, type NextRequest } from "next/server";
import { findCity, streetsOf } from "@/lib/il-address/dataset";
import { getAddressDataset } from "@/lib/il-address/service";

export const dynamic = "force-dynamic";

/** The official streets of one city: /api/address/streets?city=<סמל יישוב>. Empty for a locality without street names. */
export async function GET(request: NextRequest) {
  const code = Number(request.nextUrl.searchParams.get("city"));
  if (!Number.isInteger(code) || code <= 0) return NextResponse.json({ error: "חסר קוד יישוב תקין." }, { status: 400 });
  try {
    const dataset = await getAddressDataset();
    const city = findCity(dataset, code);
    if (!city) return NextResponse.json({ error: "היישוב לא נמצא ברשימה הרשמית." }, { status: 404 });
    return NextResponse.json({ city, streets: streetsOf(dataset, code) }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "רשימת הרחובות אינה זמינה כרגע." }, { status: 503 });
  }
}
