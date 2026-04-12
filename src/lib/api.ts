import type { LatLng, RouteSegment, TransportMode } from "@/types";

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

const SPEED_KMH: Record<TransportMode, number> = {
  car: 40,
  walk: 4.5,
  bicycle: 15,
  traffic: 20,
};

const SPEED_MS: Record<TransportMode, number> = {
  car: SPEED_KMH.car / 3.6,
  walk: SPEED_KMH.walk / 3.6,
  bicycle: SPEED_KMH.bicycle / 3.6,
  traffic: SPEED_KMH.traffic / 3.6,
};

const DIST_FACTOR: Record<TransportMode, number> = {
  car: 1.0,
  walk: 0.85,
  bicycle: 0.9,
  traffic: 1.1,
};

export function getModeColor(mode: TransportMode): string {
  const colors: Record<TransportMode, string> = {
    car: "#3B82F6",
    walk: "#22C55E",
    bicycle: "#F97316",
    traffic: "#8B5CF6",
  };
  return colors[mode];
}

export function getModeLabel(mode: TransportMode): string {
  const labels: Record<TransportMode, string> = {
    car: "자동차",
    walk: "도보",
    bicycle: "자전거",
    traffic: "대중교통",
  };
  return labels[mode];
}

export async function fetchRoute(
  points: LatLng[],
  mode: TransportMode = "car"
): Promise<RouteSegment | null> {
  if (points.length < 2) return null;

  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(`${OSRM_BASE}/driving/${coords}?overview=full&geometries=geojson`);
    if (!res.ok) return buildStraightLine(points, mode);

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return buildStraightLine(points, mode);

    const geometry: LatLng[] = route.geometry.coordinates.map(
      (c: [number, number]) => ({ lat: c[1], lng: c[0] })
    );

    const distance = route.distance * DIST_FACTOR[mode];
    const duration = distance / SPEED_MS[mode];

    return {
      from: points[0],
      to: points[points.length - 1],
      geometry,
      distance,
      duration,
    };
  } catch {
    return buildStraightLine(points, mode);
  }
}

function buildStraightLine(points: LatLng[], mode: TransportMode): RouteSegment {
  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    totalDist += haversine(points[i - 1], points[i]);
  }
  const distance = totalDist * DIST_FACTOR[mode];
  return {
    from: points[0],
    to: points[points.length - 1],
    geometry: points,
    distance,
    duration: distance / SPEED_MS[mode],
  };
}

export function getKakaoRouteUrl(
  stops: { name: string; position: LatLng }[],
  mode: TransportMode
): string {
  if (stops.length < 2) return "";

  const modeMap: Record<TransportMode, string> = { car: "car", walk: "walk", bicycle: "bicycle", traffic: "traffic" };
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
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
