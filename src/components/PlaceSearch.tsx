"use client";

import { useState, useCallback } from "react";
import { searchPlace } from "@/lib/geocoding";
import type { SearchResult, RouteStop } from "@/types";

interface PlaceSearchProps {
  onPlaceSelect: (stop: RouteStop) => void;
  stopType: "origin" | "waypoint" | "destination";
}

export default function PlaceSearch({ onPlaceSelect, stopType }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const places = await searchPlace(query);
      if (places.length === 0) {
        setError("검색 결과가 없습니다");
      }
      setResults(places);
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색 실패");
      setResults([]);
    } finally {
      setSearching(false);
    }
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
      setError(null);
    },
    [stopType, onPlaceSelect]
  );

  const typeLabel =
    stopType === "origin" ? "출발지" : stopType === "destination" ? "도착지" : "경유지";

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-500">{typeLabel} 검색</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="장소명 입력 후 검색"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-yellow-400 focus:outline-none md:text-sm md:py-1.5"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="rounded-lg bg-yellow-500 px-4 py-2.5 text-base font-semibold text-white disabled:opacity-50 md:text-sm md:px-3 md:py-1.5"
        >
          {searching ? "..." : "검색"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {results.length > 0 && (
        <ul className="max-h-60 overflow-y-auto rounded-lg border bg-white text-sm">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => handleSelect(r)}
              className="cursor-pointer px-3 py-3 hover:bg-yellow-50 border-b last:border-b-0"
            >
              <p className="font-semibold text-gray-700">{r.display_name}</p>
              <p className="text-sm text-gray-400 truncate">{r.roadAddress || r.address}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
