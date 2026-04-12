import type { LatLng, RouteSegment } from "@/types";

export async function fetchRoute(points: LatLng[]): Promise<RouteSegment | null> {
  if (points.length < 2) return null;

  try {
    const params = points.map((p) => `point=${p.lat},${p.lng}`).join("&");
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/?${params}&overview=full&geometries=geojson`
    );
    if (!res.ok) return buildStraightLine(points);

    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return buildStraightLine(points);

    const coords: LatLng[] = route.geometry.coordinates.map(
      (c: [number, number]) => ({ lat: c[1], lng: c[0] })
    );

    return {
      from: points[0],
      to: points[points.length - 1],
      geometry: coords,
      distance: route.distance,
      duration: route.duration,
    };
  } catch {
    return buildStraightLine(points);
  }
}

function buildStraightLine(points: LatLng[]): RouteSegment {
  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    totalDist += haversine(points[i - 1], points[i]);
  }
  return {
    from: points[0],
    to: points[points.length - 1],
    geometry: points,
    distance: totalDist,
    duration: totalDist / 13.9,
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
