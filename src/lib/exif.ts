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

    let thumbnail: string;
    try {
      thumbnail = await resizeToDataUrl(file, 400);
    } catch {
      thumbnail = URL.createObjectURL(file);
    }

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

function resizeToDataUrl(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no ctx")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load fail")); };
    img.src = url;
  });
}
