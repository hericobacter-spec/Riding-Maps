"use client";

import { useCallback, useState } from "react";
import { extractGpsFromFiles } from "@/lib/exif";
import type { PhotoMarker } from "@/types";

interface PhotoUploaderProps {
  onPhotosExtracted: (photos: PhotoMarker[]) => void;
}

export default function PhotoUploader({ onPhotosExtracted }: PhotoUploaderProps) {
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/jpeg") || f.type.startsWith("image/png")
      );
      if (imageFiles.length === 0) return;

      setProcessing(true);
      try {
        const markers = await extractGpsFromFiles(imageFiles);
        if (markers.length > 0) {
          onPhotosExtracted(markers);
        } else {
          alert("GPS 메타데이터가 없는 이미지입니다.");
        }
      } finally {
        setProcessing(false);
      }
    },
    [onPhotosExtracted]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      className={`rounded-lg border-2 border-dashed p-3 text-center transition-colors text-sm ${
        dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"
      }`}
    >
      <input
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
        id="photo-upload"
      />
      <label htmlFor="photo-upload" className="cursor-pointer">
        {processing ? (
          <span className="text-blue-600">처리 중...</span>
        ) : (
          <span className="text-gray-500">
            <span className="font-semibold text-blue-600">클릭</span> 또는 드래그하여 사진 추가
          </span>
        )}
      </label>
    </div>
  );
}
