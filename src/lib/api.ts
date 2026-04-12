import type { LatLng, RouteSegment, TransportMode } from "@/types";

const SPEED: Record<TransportMode, number> = {
  car: 40,
  walk: 4.5,
  bicycle: 15,
  traffic: 25,
};

export async function fetchRoute(
  points: LatLng[],
  mode: TransportMode = "car"
): Promise<RouteSegment | null> {
  if (points.length < 2) return null;
  return buildRoute(points, mode);
}

function buildRoute(points: LatLng[], mode: TransportMode): RouteSegment {
  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    totalDist += haversine(points[i - 1], points[i]);
  }

  const factor = mode === "car" ? 1.35 : mode === "traffic" ? 1.5 : mode === "bicycle" ? 1.2 : 1.1;
  const roadDist = totalDist * factor;
  const duration = roadDist / SPEED[mode];

  return {
    from: points[0],
    to: points[points.length - 1],
    geometry: points,
    distance: roadDist,
    duration,
  };
}

export function getKakaoRouteUrl(
  stops: { name: string; position: LatLng }[],
  mode: TransportMode
): string {
  if (stops.length < 2) return "";

  const modeMap: Record<TransportMode, string> = {
    car: "car",
    walk: "walk",
    bicycle: "bicycle",
    traffic: "traffic",
  };

  const parts = stops.map((s) => `${encodeURIComponent(s.name)},${s.position.lat},${s.position.lng}`);
  const from = parts[0];
  const to = parts[parts.length - 1];
  const vias = parts.slice(1, -1);

  let url = `https://map.kakao.com/link/by/${modeMap[mode]}/${from}`;
  if (vias.length > 0) url += `/${vias.join("/")}`;
  url += `/${to}`;
  return url;
}

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
