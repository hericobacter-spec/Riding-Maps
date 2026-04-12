"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakaoLoader";
import type { RouteStop, RouteSegment, PhotoMarker } from "@/types";

interface MapContainerProps {
  stops: RouteStop[];
  route: RouteSegment | null;
  unassignedPhotos: PhotoMarker[];
  onStopClick?: (stopId: string) => void;
}

export default function MapContainer({
  stops,
  route,
  unassignedPhotos,
  onStopClick,
}: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("초기화 중...");

  useEffect(() => {
    let mounted = true;

    const sdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services`;
    setStatus(`SDK 로딩 중... URL: ${sdkUrl}`);
    loadKakaoMaps()
      .then(() => {
        if (!mounted) return;
        setStatus("SDK 로드됨, 지도 생성 중...");

        const el = containerRef.current;
        if (!el) {
          setStatus("에러: 컨테이너 요소 없음");
          return;
        }

        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (w === 0 || h === 0) {
          setStatus(`에러: 컨테이너 크기 0 (w=${w}, h=${h})`);
          return;
        }

        const lat = stops.length > 0 ? stops[0].position.lat : 37.5665;
        const lng = stops.length > 0 ? stops[0].position.lng : 126.978;

        try {
          const center = new kakao.maps.LatLng(lat, lng);
          const map = new kakao.maps.Map(el, { center, level: 5 });
          mapRef.current = map;
          setReady(true);
          setStatus("");
        } catch (e) {
          setStatus("지도 생성 에러: " + (e instanceof Error ? e.message : String(e)));
        }
      })
      .catch((err) => {
        if (mounted) setStatus("SDK 로딩 실패: " + err.message);
      });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    const prev: kakao.maps.Marker[] = (containerRef.current as any).__markers__ || [];
    prev.forEach((m) => m.setMap(null));
    const markers: kakao.maps.Marker[] = [];
    (containerRef.current as any).__markers__ = markers;

    if (stops.length === 0) return;

    stops.forEach((stop) => {
      const position = new kakao.maps.LatLng(stop.position.lat, stop.position.lng);
      const colors: Record<string, string> = { origin: "#22C55E", waypoint: "#3B82F6", destination: "#EF4444" };
      const labels: Record<string, string> = { origin: "S", waypoint: "W", destination: "E" };
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="${colors[stop.type]}" stroke="white" stroke-width="3"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="13" font-weight="bold">${labels[stop.type]}</text></svg>`;

      const markerImage = new kakao.maps.MarkerImage(
        `data:image/svg+xml;base64,${btoa(svg)}`,
        new kakao.maps.Size(32, 32),
        { offset: new kakao.maps.Point(16, 16) }
      );
      const marker = new kakao.maps.Marker({ position, image: markerImage, map });
      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;"><strong>${stop.name}</strong><br/>${stop.position.lat.toFixed(4)}, ${stop.position.lng.toFixed(4)}</div>`,
        removable: true,
      });
      kakao.maps.event.addListener(marker, "click", () => {
        infoWindow.open(map, marker);
        onStopClick?.(stop.id);
      });
      markers.push(marker);
    });

    const sw = stops.reduce((m, s) => ({ lat: Math.min(m.lat, s.position.lat), lng: Math.min(m.lng, s.position.lng) }), { lat: Infinity, lng: Infinity });
    const ne = stops.reduce((m, s) => ({ lat: Math.max(m.lat, s.position.lat), lng: Math.max(m.lng, s.position.lng) }), { lat: -Infinity, lng: -Infinity });
    const bounds = new kakao.maps.LatLngBounds(new kakao.maps.LatLng(sw.lat, sw.lng), new kakao.maps.LatLng(ne.lat, ne.lng));
    map.setBounds(bounds);
  }, [stops, ready, onStopClick]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const prev: kakao.maps.Polyline | null = (containerRef.current as any).__polyline__ || null;
    if (prev) prev.setMap(null);
    (containerRef.current as any).__polyline__ = null;
    if (!route) return;
    const path = route.geometry.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
    const polyline = new kakao.maps.Polyline({ path, strokeWeight: 5, strokeColor: "#3B82F6", strokeOpacity: 0.7 });
    polyline.setMap(mapRef.current);
    (containerRef.current as any).__polyline__ = polyline;
  }, [route, ready]);

  return (
    <>
      {status && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
          <div className="rounded-lg bg-white p-6 shadow-lg text-center">
            <p className="text-sm text-gray-600">{status}</p>
            <p className="mt-2 text-xs text-gray-400">
              kakao: {typeof window !== "undefined" && window.kakao ? "O" : "X"} |
              maps: {typeof window !== "undefined" && window.kakao?.maps ? "O" : "X"} |
              LatLng: {typeof window !== "undefined" && window.kakao?.maps?.LatLng ? "O" : "X"}
            </p>
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </>
  );
}
