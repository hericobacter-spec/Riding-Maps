import { NextRequest, NextResponse } from "next/server";

const KAKAO_API = "https://apis-navi.kakaomobility.com/v1/directions";

export async function GET(req: NextRequest) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "KAKAO_REST_API_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const waypoints = searchParams.get("waypoints");

  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
  }

  let url = `${KAKAO_API}?origin=${origin}&destination=${destination}&priority=RECOMMEND`;
  if (waypoints) url += `&waypoints=${waypoints}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
