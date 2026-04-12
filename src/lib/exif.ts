import exifr from "exifr";
import type { LatLng, PhotoMarker } from "@/types";

export async function extractGpsFromImage(file: File): Promise<PhotoMarker | null> {
  try {
    const buffer = await file.arrayBuffer();

    const gps = await exifr.gps(buffer);
    if (!gps || gps.latitude == null || gps.longitude == null) {
      console.warn(`[EXIF] GPS 없음: ${file.name} (${file.size} bytes, ${file.type})`);
      try {
        const allMeta = await exifr.parse(buffer, { tiff: true, exif: true });
        console.log(`[EXIF] 메타데이터 키:`, allMeta ? Object.keys(allMeta) : "없음");
      } catch {}
      return null;
    }

    const position: LatLng = { lat: gps.latitude, lng: gps.longitude };
    const thumbnail = URL.createObjectURL(file);

    let timestamp: Date | null = null;
    let altitude: number | null = null;
    try {
      const fullExif = await exifr.parse(buffer, { tiff: true, exif: true });
      if (fullExif) {
        const dt = fullExif.DateTimeOriginal || fullExif.CreateDate || fullExif.ModifyDate;
        timestamp = dt instanceof Date ? dt : (dt ? new Date(dt) : null);
        altitude = typeof fullExif.GPSAltitude === "number" ? fullExif.GPSAltitude : null;
      }
    } catch {}

    console.log(`[EXIF] GPS 추출 성공: ${file.name}`, position);
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
