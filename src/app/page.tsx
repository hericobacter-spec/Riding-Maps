"use client";

import { useState, useCallback, useEffect } from "react";
import MapContainer from "@/components/map/MapContainer";
import PlaceSearch from "@/components/PlaceSearch";
import StopList from "@/components/StopList";
import StopEditor from "@/components/StopEditor";
import PhotoUploader from "@/components/PhotoUploader";
import MarkdownEditor from "@/components/MarkdownEditor";
import ExportPanel from "@/components/ExportPanel";
import { fetchRoute } from "@/lib/api";
import type { RouteStop, RouteSegment, PhotoMarker, Journey, TransportMode } from "@/types";

type AddMode = "origin" | "waypoint" | "destination";
type SidebarTab = "journeys" | "route" | "journal";

const STORAGE_KEY = "travel-journeys";

function loadJourneys(): Journey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveJourneys(journeys: Journey[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

function createJourney(title?: string): Journey {
  return {
    id: crypto.randomUUID(),
    title: title || "새 여정",
    stops: [],
    content: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function Home() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>("waypoint");
  const [route, setRoute] = useState<RouteSegment | null>(null);
  const [unassignedPhotos, setUnassignedPhotos] = useState<PhotoMarker[]>([]);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("journeys");
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");

  useEffect(() => {
    const loaded = loadJourneys();
    setJourneys(loaded);
    if (loaded.length > 0) setActiveJourneyId(loaded[0].id);
  }, []);

  useEffect(() => {
    if (journeys.length > 0) saveJourneys(journeys);
  }, [journeys]);

  const activeJourney = journeys.find((j) => j.id === activeJourneyId) ?? null;
  const selectedStop = activeJourney?.stops.find((s) => s.id === selectedStopId) ?? null;

  const updateJourney = useCallback((updated: Journey) => {
    setJourneys((prev) =>
      prev.map((j) => (j.id === updated.id ? { ...updated, updatedAt: new Date() } : j))
    );
  }, []);

  const handleNewJourney = useCallback(() => {
    const j = createJourney();
    setJourneys((prev) => [j, ...prev]);
    setActiveJourneyId(j.id);
    setSelectedStopId(null);
    setRoute(null);
    setUnassignedPhotos([]);
    setSidebarTab("route");
    setMobileMenu(true);
  }, []);

  const handleDeleteJourney = useCallback(
    (id: string) => {
      setJourneys((prev) => {
        const next = prev.filter((j) => j.id !== id);
        if (activeJourneyId === id) {
          setActiveJourneyId(next.length > 0 ? next[0].id : null);
          setRoute(null);
          setUnassignedPhotos([]);
          setSelectedStopId(null);
        }
        saveJourneys(next);
        return next;
      });
    },
    [activeJourneyId]
  );

  const handleSelectJourney = useCallback((id: string) => {
    setActiveJourneyId(id);
    setSelectedStopId(null);
    setRoute(null);
    setUnassignedPhotos([]);
    setSidebarTab("route");
    setMobileMenu(true);
  }, []);

  const handleTitleChange = useCallback(
    (title: string) => {
      if (!activeJourney) return;
      updateJourney({ ...activeJourney, title });
    },
    [activeJourney, updateJourney]
  );

  const handleContentChange = useCallback(
    (content: string) => {
      if (!activeJourney) return;
      updateJourney({ ...activeJourney, content });
    },
    [activeJourney, updateJourney]
  );

  const addStop = useCallback(
    (stop: RouteStop) => {
      if (!activeJourney) return;
      const updated = {
        ...activeJourney,
        stops: [...activeJourney.stops, { ...stop, order: activeJourney.stops.length }],
        updatedAt: new Date(),
      };
      updateJourney(updated);
      rebuildRoute(updated.stops);
    },
    [activeJourney, updateJourney]
  );

  const removeStop = useCallback(
    (id: string) => {
      if (!activeJourney) return;
      const updated = {
        ...activeJourney,
        stops: activeJourney.stops
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, order: i })),
        updatedAt: new Date(),
      };
      updateJourney(updated);
      setSelectedStopId((prev) => (prev === id ? null : prev));
      rebuildRoute(updated.stops);
    },
    [activeJourney, updateJourney]
  );

  const reorderStops = useCallback(
    (from: number, to: number) => {
      if (!activeJourney) return;
      const arr = [...activeJourney.stops];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      const updated = {
        ...activeJourney,
        stops: arr.map((s, i) => ({ ...s, order: i })),
        updatedAt: new Date(),
      };
      updateJourney(updated);
      rebuildRoute(updated.stops);
    },
    [activeJourney, updateJourney]
  );

  const updateStop = useCallback(
    (updatedStop: RouteStop) => {
      if (!activeJourney) return;
      updateJourney({
        ...activeJourney,
        stops: activeJourney.stops.map((s) => (s.id === updatedStop.id ? updatedStop : s)),
      });
    },
    [activeJourney, updateJourney]
  );

  const addPhotosToStop = useCallback(
    (photos: PhotoMarker[]) => {
      if (!activeJourney) return;
      if (!selectedStopId) {
        setUnassignedPhotos((prev) => [...prev, ...photos]);
        return;
      }
      updateJourney({
        ...activeJourney,
        stops: activeJourney.stops.map((s) =>
          s.id === selectedStopId ? { ...s, photos: [...s.photos, ...photos] } : s
        ),
      });
    },
    [activeJourney, selectedStopId, updateJourney]
  );

  const removePhotoFromStop = useCallback(
    (photoId: string) => {
      if (!activeJourney) return;
      updateJourney({
        ...activeJourney,
        stops: activeJourney.stops.map((s) => ({
          ...s,
          photos: s.photos.filter((p) => p.id !== photoId),
        })),
      });
    },
    [activeJourney, updateJourney]
  );

  async function rebuildRoute(stops: RouteStop[]) {
    if (stops.length < 2) {
      setRoute(null);
      return;
    }
    const points = stops.map((s) => s.position);
    const result = await fetchRoute(points, transportMode);
    setRoute(result);
  }

  const handleStopClick = useCallback((id: string) => {
    setSelectedStopId(id);
    setSidebarTab("journal");
    setMobileMenu(true);
  }, []);

  const handleDrawRoute = useCallback(() => {
    if (activeJourney) rebuildRoute(activeJourney.stops);
  }, [activeJourney]);

  return (
    <div className="flex h-[100dvh] flex-col bg-gray-100">
      {/* Header */}
      <header className="flex items-center gap-2 border-b bg-white px-3 py-2 shadow-sm shrink-0 md:gap-4 md:px-4">
        <h1 className="text-base font-bold text-gray-800 shrink-0 md:text-lg">Riding Maps</h1>
        {activeJourney && (
          <input
            type="text"
            value={activeJourney.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="여정 제목"
            className="hidden md:block flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-yellow-400 focus:outline-none"
          />
        )}
        <span className="md:hidden flex-1 text-sm font-medium text-gray-600 truncate">
          {activeJourney?.title || ""}
        </span>
        <div className="hidden md:flex gap-1 shrink-0">
          <button
            onClick={() => setAddMode("origin")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${addMode === "origin" ? "bg-green-600 text-white" : "bg-green-50 text-green-700"}`}
          >
            출발지
          </button>
          <button
            onClick={() => setAddMode("waypoint")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${addMode === "waypoint" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
          >
            경유지
          </button>
          <button
            onClick={() => setAddMode("destination")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${addMode === "destination" ? "bg-red-600 text-white" : "bg-red-50 text-red-700"}`}
          >
            도착지
          </button>
        </div>
        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="md:hidden rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
        >
          {mobileMenu ? "지도" : "메뉴"}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            stops={activeJourney?.stops ?? []}
            route={route}
            unassignedPhotos={unassignedPhotos}
            onStopClick={handleStopClick}
          />
        </div>

        {/* Sidebar - desktop always visible, mobile overlay */}
        <aside
          className={`flex flex-col border-l bg-white transition-all duration-300
            w-full absolute inset-y-0 right-0 z-20 md:static md:w-96
            ${mobileMenu ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          `}
        >
          {/* Mobile close */}
          <button
            onClick={() => setMobileMenu(false)}
            className="md:hidden self-end px-3 py-2 text-sm text-gray-400"
          >
            닫기 ✕
          </button>

          {/* Mobile add mode buttons */}
          <div className="flex md:hidden gap-1 px-3 pb-2">
            <button
              onClick={() => setAddMode("origin")}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${addMode === "origin" ? "bg-green-600 text-white" : "bg-green-50 text-green-700"}`}
            >
              출발지
            </button>
            <button
              onClick={() => setAddMode("waypoint")}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${addMode === "waypoint" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
            >
              경유지
            </button>
            <button
              onClick={() => setAddMode("destination")}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${addMode === "destination" ? "bg-red-600 text-white" : "bg-red-50 text-red-700"}`}
            >
              도착지
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b shrink-0">
            {(["journeys", "route", "journal"] as const).map((tab) => {
              const labels = { journeys: "여정 목록", route: "경로", journal: "글쓰기" };
              return (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 px-3 py-3 text-sm font-medium md:text-xs md:py-2.5 ${
                    sidebarTab === tab
                      ? "border-b-2 border-yellow-500 text-yellow-600"
                      : "text-gray-400"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidebarTab === "journeys" && (
              <>
                <button
                  onClick={handleNewJourney}
                  className="w-full rounded-lg bg-yellow-500 py-3 text-base font-semibold text-white hover:bg-yellow-600 md:py-2.5 md:text-sm"
                >
                  + 새 여정 만들기
                </button>
                {journeys.length === 0 && (
                  <p className="py-12 text-center text-base text-gray-400">
                    여정을 만들어 시작하세요
                  </p>
                )}
                <ul className="space-y-3">
                  {journeys.map((j) => (
                    <li
                      key={j.id}
                      onClick={() => handleSelectJourney(j.id)}
                      className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        j.id === activeJourneyId
                          ? "border-yellow-400 bg-yellow-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-800 truncate md:text-sm">
                            {j.title}
                          </p>
                          <p className="mt-1 text-sm text-gray-400 md:text-xs">
                            {j.stops.length}개 정지 | {new Date(j.createdAt).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJourney(j.id);
                          }}
                          className="ml-3 text-sm text-gray-300 hover:text-red-500 md:text-xs"
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {!activeJourney && sidebarTab !== "journeys" && (
              <p className="py-16 text-center text-base text-gray-400">
                먼저 여정을 선택하거나 만드세요
              </p>
            )}

            {activeJourney && sidebarTab === "route" && (
              <>
                <PlaceSearch onPlaceSelect={addStop} stopType={addMode} />
                <StopList
                  stops={activeJourney.stops}
                  onRemove={removeStop}
                  onReorder={reorderStops}
                  onSelect={(s) => {
                    setSelectedStopId(s.id);
                    setSidebarTab("journal");
                  }}
                  selectedId={selectedStopId}
                />
                {activeJourney.stops.length >= 2 && (
                  <>
                    <div className="grid grid-cols-4 gap-1">
                      {([
                        { mode: "car" as const, label: "자동차", icon: "🚗" },
                        { mode: "walk" as const, label: "도보", icon: "🚶" },
                        { mode: "bicycle" as const, label: "자전거", icon: "🚴" },
                        { mode: "traffic" as const, label: "대중교통", icon: "🚌" },
                      ]).map(({ mode, label, icon }) => (
                        <button
                          key={mode}
                          onClick={() => setTransportMode(mode)}
                          className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                            transportMode === mode
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleDrawRoute}
                      className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 md:py-2 md:text-sm"
                    >
                      경로 그리기
                    </button>
                  </>
                )}
                {route && (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 md:text-xs md:p-3">
                    <p>
                      총 거리:{" "}
                      {route.distance >= 1000
                        ? `${(route.distance / 1000).toFixed(1)} km`
                        : `${Math.round(route.distance)} m`}
                    </p>
                    <p>
                      예상 시간:{" "}
                      {route.duration >= 3600
                        ? `${Math.floor(route.duration / 3600)}시간 ${Math.floor((route.duration % 3600) / 60)}분`
                        : `${Math.floor(route.duration / 60)}분`}
                    </p>
                  </div>
                )}
                <PhotoUploader onPhotosExtracted={addPhotosToStop} />
                {unassignedPhotos.length > 0 && (
                  <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                    미할당 사진 {unassignedPhotos.length}장 — 정지를 선택 후 사진을 추가하세요
                  </div>
                )}
              </>
            )}

            {activeJourney && sidebarTab === "journal" && (
              <>
                {selectedStop ? (
                  <StopEditor
                    key={selectedStop.id}
                    stop={selectedStop}
                    onUpdate={updateStop}
                    onAddPhotos={addPhotosToStop}
                    onRemovePhoto={removePhotoFromStop}
                  />
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-400">
                      정지를 선택하면 개별 메모를 작성할 수 있습니다.
                    </p>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-500">
                        전체 여정 메모
                      </label>
                      <MarkdownEditor
                        value={activeJourney.content}
                        onChange={handleContentChange}
                        placeholder="여행에 대한 전반적인 글을 작성하세요..."
                        minRows={8}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {activeJourney && (
            <div className="border-t p-4 shrink-0">
              <ExportPanel journal={activeJourney} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
