import exifr from "exifr";
import type { LatLng, PhotoMarker } from "@/types";

export async function extractGpsFromImage(file: File): Promise<PhotoMarker | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps) return null;

    const fullExif = await exifr.parse(file);
    const position: LatLng = { lat: gps.latitude, lng: gps.longitude };
    const thumbnail = URL.createObjectURL(file);

    return {
      id: crypto.randomUUID(),
      position,
      thumbnail,
      originalUrl: thumbnail,
      timestamp: fullExif?.DateTimeOriginal ?? null,
      altitude: (fullExif?.GPSAltitude as number) ?? null,
      fileName: file.name,
    };
  } catch {
    return null;
  }
}

export async function extractGpsFromFiles(files: File[]): Promise<PhotoMarker[]> {
  const results = await Promise.allSettled(files.map(extractGpsFromImage));
  return results
    .filter(
      (r): r is PromiseFulfilledResult<PhotoMarker | null> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value!);
}
