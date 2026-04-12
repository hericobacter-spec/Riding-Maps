"use client";

import { useState, useCallback } from "react";
import MarkdownEditor from "./MarkdownEditor";
import type { RouteStop, PhotoMarker } from "@/types";

interface StopEditorProps {
  stop: RouteStop;
  onUpdate: (stop: RouteStop) => void;
  onAddPhotos: (photos: PhotoMarker[]) => void;
  onRemovePhoto: (photoId: string) => void;
}

export default function StopEditor({ stop, onUpdate, onAddPhotos, onRemovePhoto }: StopEditorProps) {
  const [tab, setTab] = useState<"memo" | "photos">("memo");

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const { extractGpsFromFiles } = await import("@/lib/exif");
      const markers = await extractGpsFromFiles(Array.from(files));
      if (markers.length > 0) onAddPhotos(markers);
      else alert("GPS 메타데이터가 없는 이미지입니다.");
    },
    [onAddPhotos]
  );

  const typeLabel =
    stop.type === "origin" ? "출발지" : stop.type === "destination" ? "도착지" : "경유지";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">
          {stop.name} <span className="text-xs font-normal text-gray-400">({typeLabel})</span>
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setTab("memo")}
            className={`rounded px-2 py-1 text-xs ${tab === "memo" ? "bg-blue-100 text-blue-700" : "text-gray-400"}`}
          >
            메모
          </button>
          <button
            onClick={() => setTab("photos")}
            className={`rounded px-2 py-1 text-xs ${tab === "photos" ? "bg-blue-100 text-blue-700" : "text-gray-400"}`}
          >
            사진 ({stop.photos.length})
          </button>
        </div>
      </div>

      {tab === "memo" && (
        <MarkdownEditor
          value={stop.content}
          onChange={(v) => onUpdate({ ...stop, content: v })}
          placeholder={`${stop.name}에서의 여행 메모...`}
          minRows={5}
        />
      )}

      {tab === "photos" && (
        <div className="space-y-2">
          <label className="flex items-center justify-center rounded-md border border-dashed border-gray-300 p-3 text-xs text-gray-400 cursor-pointer hover:border-blue-300">
            <input type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
            + 사진 추가
          </label>
          {stop.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {stop.photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <img
                    src={photo.thumbnail}
                    alt={photo.fileName}
                    className="h-20 w-full rounded-md object-cover"
                  />
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <p className="mt-0.5 truncate text-[10px] text-gray-400">{photo.fileName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
