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
import type { RouteStop, RouteSegment, PhotoMarker, Journey } from "@/types";

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
    const result = await fetchRoute(points);
    setRoute(result);
  }

  const handleStopClick = useCallback((id: string) => {
    setSelectedStopId(id);
    setSidebarTab("journal");
  }, []);

  const handleDrawRoute = useCallback(() => {
    if (activeJourney) rebuildRoute(activeJourney.stops);
  }, [activeJourney]);

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <header className="flex items-center gap-4 border-b bg-white px-4 py-2 shadow-sm">
        <h1 className="text-lg font-bold text-gray-800 shrink-0">여행 경로 에디터</h1>
        {activeJourney && (
          <input
            type="text"
            value={activeJourney.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="여정 제목"
            className="flex-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-yellow-400 focus:outline-none"
          />
        )}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setAddMode("origin")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              addMode === "origin" ? "bg-green-600 text-white" : "bg-green-50 text-green-700"
            }`}
          >
            출발지
          </button>
          <button
            onClick={() => setAddMode("waypoint")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              addMode === "waypoint" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"
            }`}
          >
            경유지
          </button>
          <button
            onClick={() => setAddMode("destination")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              addMode === "destination" ? "bg-red-600 text-white" : "bg-red-50 text-red-700"
            }`}
          >
            도착지
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <MapContainer
            stops={activeJourney?.stops ?? []}
            route={route}
            unassignedPhotos={unassignedPhotos}
            onStopClick={handleStopClick}
          />
        </div>

        <aside className="flex w-96 flex-col border-l bg-white">
          <div className="flex border-b">
            <button
              onClick={() => setSidebarTab("journeys")}
              className={`flex-1 px-3 py-2.5 text-xs font-medium ${
                sidebarTab === "journeys"
                  ? "border-b-2 border-yellow-500 text-yellow-600"
                  : "text-gray-400"
              }`}
            >
              여정 목록
            </button>
            <button
              onClick={() => setSidebarTab("route")}
              className={`flex-1 px-3 py-2.5 text-xs font-medium ${
                sidebarTab === "route"
                  ? "border-b-2 border-yellow-500 text-yellow-600"
                  : "text-gray-400"
              }`}
            >
              경로
            </button>
            <button
              onClick={() => setSidebarTab("journal")}
              className={`flex-1 px-3 py-2.5 text-xs font-medium ${
                sidebarTab === "journal"
                  ? "border-b-2 border-yellow-500 text-yellow-600"
                  : "text-gray-400"
              }`}
            >
              글쓰기
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {sidebarTab === "journeys" && (
              <>
                <button
                  onClick={handleNewJourney}
                  className="w-full rounded-md bg-yellow-500 py-2.5 text-sm font-medium text-white hover:bg-yellow-600"
                >
                  + 새 여정 만들기
                </button>
                {journeys.length === 0 && (
                  <p className="py-8 text-center text-sm text-gray-400">
                    여정을 만들어 시작하세요
                  </p>
                )}
                <ul className="space-y-2">
                  {journeys.map((j) => (
                    <li
                      key={j.id}
                      onClick={() => handleSelectJourney(j.id)}
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${
                        j.id === activeJourneyId
                          ? "border-yellow-400 bg-yellow-50 ring-1 ring-yellow-300"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{j.title}</p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {j.stops.length}개 정지 | {new Date(j.createdAt).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteJourney(j.id);
                          }}
                          className="ml-2 text-xs text-gray-300 hover:text-red-500"
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
              <p className="py-12 text-center text-sm text-gray-400">
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
                  <button
                    onClick={handleDrawRoute}
                    className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    경로 그리기
                  </button>
                )}
                {route && (
                  <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-600">
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
                  <div className="rounded-md bg-yellow-50 p-2 text-xs text-yellow-700">
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
                    <p className="text-xs text-gray-400">
                      정지를 선택하면 개별 메모를 작성할 수 있습니다.
                    </p>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
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
            <div className="border-t p-4">
              <ExportPanel journal={activeJourney} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
