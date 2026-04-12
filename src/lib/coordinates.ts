import type { LatLng } from "@/types";

export function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  direction: "N" | "S" | "E" | "W"
): number {
  const decimal = degrees + minutes / 60 + seconds / 3600;
  return direction === "S" || direction === "W" ? -decimal : decimal;
}

export function isValidCoordinate(coord: LatLng): boolean {
  return (
    isFinite(coord.lat) &&
    isFinite(coord.lng) &&
    Math.abs(coord.lat) <= 90 &&
    Math.abs(coord.lng) <= 180
  );
}
