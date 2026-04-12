import type { LatLng, RouteSegment, TransportMode } from "@/types";

const OSRM_BASE = "https://router.project-osrm.org/route/v1";

function getProfile(mode: TransportMode): string {
  switch (mode) {
    case "bicycle": return "bike";
    case "walk": return "foot";
    case "car":
    case "traffic":
    default: return "driving";
  }
}

function getSpeed(mode: TransportMode): number {
  switch (mode) {
    case "walk": return 4.5;
    case "bicycle": return 15;
    case "traffic": return 25;
    case "car": default: return 50;
  }
}

export async function fetchRoute(
  points: LatLng[],
  mode: TransportMode = "car"
): Promise<RouteSegment | null> {
  if (points.length < 2) return null;

  const profile = getProfile(mode);

  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(
      `${OSRM_BASE}/${profile}/${coords}?overview=full&geometries=geojson`
    );
    if (!res.ok) return buildStraightLine(points, mode);

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return buildStraightLine(points, mode);

    const geometry: LatLng[] = route.geometry.coordinates.map(
      (c: [number, number]) => ({ lat: c[1], lng: c[0] })
    );

    return {
      from: points[0],
      to: points[points.length - 1],
      geometry,
      distance: route.distance,
      duration: route.duration,
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
  return {
    from: points[0],
    to: points[points.length - 1],
    geometry: points,
    distance: totalDist,
    duration: totalDist / getSpeed(mode),
  };
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
