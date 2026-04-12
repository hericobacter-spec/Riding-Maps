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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    loadKakaoMaps()
      .then(() => {
        if (!mounted || !containerRef.current) return;

        const el = containerRef.current;
        if (el.offsetWidth === 0 || el.offsetHeight === 0) {
          setError("지도 영역 크기가 0입니다");
          return;
        }

        const center =
          stops.length > 0
            ? new kakao.maps.LatLng(stops[0].position.lat, stops[0].position.lng)
            : new kakao.maps.LatLng(37.5665, 126.978);

        const map = new kakao.maps.Map(el, {
          center,
          level: 5,
        });
        mapRef.current = map;
        setReady(true);
        setError(null);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    const prevMarkers: kakao.maps.Marker[] = (containerRef.current as any).__markers__ || [];
    prevMarkers.forEach((m) => m.setMap(null));
    const markers: kakao.maps.Marker[] = [];
    (containerRef.current as any).__markers__ = markers;

    if (stops.length === 0) return;

    stops.forEach((stop) => {
      const position = new kakao.maps.LatLng(stop.position.lat, stop.position.lng);

      const colors: Record<string, string> = { origin: "#22C55E", waypoint: "#3B82F6", destination: "#EF4444" };
      const labels: Record<string, string> = { origin: "S", waypoint: "W", destination: "E" };
      const color = colors[stop.type];
      const label = labels[stop.type];

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="3"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="13" font-weight="bold">${label}</text></svg>`;

      const markerImage = new kakao.maps.MarkerImage(
        `data:image/svg+xml;base64,${btoa(svg)}`,
        new kakao.maps.Size(32, 32),
        { offset: new kakao.maps.Point(16, 16) }
      );

      const marker = new kakao.maps.Marker({ position, image: markerImage, map });
      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:8px;font-size:12px;min-width:120px;"><strong>${stop.name}</strong><br/><span style="color:#888;">${stop.position.lat.toFixed(4)}, ${stop.position.lng.toFixed(4)}</span></div>`,
        removable: true,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        infoWindow.open(map, marker);
        onStopClick?.(stop.id);
      });

      markers.push(marker);
    });

    if (stops.length > 0) {
      const bounds = new kakao.maps.LatLngBounds(
        new kakao.maps.LatLng(stops[0].position.lat, stops[0].position.lng),
        new kakao.maps.LatLng(stops[0].position.lat, stops[0].position.lng)
      );
      stops.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.position.lat, s.position.lng)));
      map.setBounds(bounds);
    }
  }, [stops, ready, onStopClick]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    const prev: kakao.maps.Polyline | null = (containerRef.current as any).__polyline__ || null;
    if (prev) prev.setMap(null);
    (containerRef.current as any).__polyline__ = null;

    if (!route) return;

    const path = route.geometry.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
    const polyline = new kakao.maps.Polyline({
      path,
      strokeWeight: 5,
      strokeColor: "#3B82F6",
      strokeOpacity: 0.7,
    });
    polyline.setMap(map);
    (containerRef.current as any).__polyline__ = polyline;
  }, [route, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;

    const prev: kakao.maps.Marker[] = (containerRef.current as any).__photoMarkers__ || [];
    prev.forEach((m) => m.setMap(null));
    const pMarkers: kakao.maps.Marker[] = [];
    (containerRef.current as any).__photoMarkers__ = pMarkers;

    unassignedPhotos.forEach((photo) => {
      const position = new kakao.maps.LatLng(photo.position.lat, photo.position.lng);
      const markerImage = new kakao.maps.MarkerImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" rx="6" fill="white" stroke="#ddd"/><text x="22" y="28" text-anchor="middle" font-size="20">📷</text></svg>`)}`,
        new kakao.maps.Size(44, 44),
        { offset: new kakao.maps.Point(22, 22) }
      );

      const marker = new kakao.maps.Marker({ position, image: markerImage, map });
      const infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:6px;font-size:12px;"><img src="${photo.thumbnail}" style="width:120px;border-radius:4px;margin-bottom:4px;"/><br/>${photo.position.lat.toFixed(4)}, ${photo.position.lng.toFixed(4)}<br/>${photo.fileName}</div>`,
        removable: true,
      });

      kakao.maps.event.addListener(marker, "click", () => infoWindow.open(map, marker));
      pMarkers.push(marker);
    });
  }, [unassignedPhotos, ready]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
    />
  );
}
