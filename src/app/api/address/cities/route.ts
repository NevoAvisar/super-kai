import { NextResponse } from "next/server";
import { getAddressDataset } from "@/lib/il-address/service";

export const dynamic = "force-dynamic";

/** Every official locality, for the city dropdown (about 1,300 short rows; filtered in the browser). */
export async function GET() {
  try {
    const { cities, fetchedAt } = await getAddressDataset();
    return NextResponse.json({ cities, fetchedAt }, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "רשימת היישובים אינה זמינה כרגע." }, { status: 503 });
  }
}
