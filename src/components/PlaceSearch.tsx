"use client";

import { useState, useCallback } from "react";
import { loadKakaoMaps } from "@/lib/kakaoLoader";
import type { SearchResult, RouteStop } from "@/types";

interface PlaceSearchProps {
  onPlaceSelect: (stop: RouteStop) => void;
  stopType: "origin" | "waypoint" | "destination";
}

export default function PlaceSearch({ onPlaceSelect, stopType }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    await loadKakaoMaps();
    const { searchPlace } = await import("@/lib/geocoding");
    const places = await searchPlace(query);
    setResults(places);
    setSearching(false);
  }, [query]);

  const handleSelect = useCallback(
    (place: SearchResult) => {
      const stop: RouteStop = {
        id: crypto.randomUUID(),
        name: place.display_name,
        position: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) },
        type: stopType,
        order: 0,
        photos: [],
        content: "",
      };
      onPlaceSelect(stop);
      setQuery("");
      setResults([]);
    },
    [stopType, onPlaceSelect]
  );

  const typeLabel =
    stopType === "origin" ? "출발지" : stopType === "destination" ? "도착지" : "경유지";

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-500">{typeLabel} 검색</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="장소명 입력..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="rounded-md bg-yellow-500 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {searching ? "..." : "검색"}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-md border bg-white text-sm">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              className="cursor-pointer px-3 py-2 hover:bg-yellow-50 border-b last:border-b-0"
            >
              <p className="font-medium text-gray-700">{r.display_name}</p>
              <p className="text-xs text-gray-400 truncate">{r.roadAddress || r.address}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
