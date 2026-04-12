"use client";

import type { RouteStop } from "@/types";

interface StopListProps {
  stops: RouteStop[];
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSelect: (stop: RouteStop) => void;
  selectedId: string | null;
}

export default function StopList({
  stops,
  onRemove,
  onReorder,
  onSelect,
  selectedId,
}: StopListProps) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (fromIndex !== targetIndex) onReorder(fromIndex, targetIndex);
  };

  if (stops.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-gray-500">경로 순서</h3>
      <ul className="space-y-1">
        {stops.map((stop, i) => {
          const typeLabel =
            stop.type === "origin"
              ? "출발"
              : stop.type === "destination"
                ? "도착"
                : "경유";
          const bg =
            stop.type === "origin"
              ? "bg-green-50 border-green-200"
              : stop.type === "destination"
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200";
          const badge =
            stop.type === "origin"
              ? "bg-green-500"
              : stop.type === "destination"
                ? "bg-red-500"
                : "bg-blue-500";

          return (
            <li
              key={stop.id}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, i)}
              onClick={() => onSelect(stop)}
              className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-all ${bg} ${
                selectedId === stop.id ? "ring-2 ring-blue-400" : ""
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shrink-0">
                <span className={`inline-block h-2 w-2 rounded-full ${badge}`} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{stop.name}</p>
                <p className="text-xs text-gray-400">
                  {typeLabel}
                  {stop.photos.length > 0 && ` | 사진 ${stop.photos.length}장`}
                  {stop.content && " | 메모 있음"}
                </p>
              </div>
              <span className="text-xs text-gray-400 mr-1">#{i + 1}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(stop.id);
                }}
                className="text-gray-400 hover:text-red-500 shrink-0"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
