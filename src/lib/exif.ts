import exifr from "exifr";
import type { LatLng, PhotoMarker } from "@/types";

export async function extractGpsFromImage(file: File): Promise<PhotoMarker | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps) {
      console.warn(`[EXIF] GPS 없음: ${file.name}, size=${file.size}, type=${file.type}`);
      const allMeta = await exifr.parse(file, true);
      console.log(`[EXIF] 전체 메타데이터 키:`, allMeta ? Object.keys(allMeta) : "없음");
      return null;
    }

    const position: LatLng = { lat: gps.latitude, lng: gps.longitude };
    const thumbnail = URL.createObjectURL(file);

    let timestamp: Date | null = null;
    let altitude: number | null = null;
    try {
      const fullExif = await exifr.parse(file);
      timestamp = fullExif?.DateTimeOriginal ?? fullExif?.CreateDate ?? null;
      altitude = (fullExif?.GPSAltitude as number) ?? null;
    } catch {}

    return {
      id: crypto.randomUUID(),
      position,
      thumbnail,
      originalUrl: thumbnail,
      timestamp,
      altitude,
      fileName: file.name,
    };
  } catch (err) {
    console.error(`[EXIF] 추출 실패: ${file.name}`, err);
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
