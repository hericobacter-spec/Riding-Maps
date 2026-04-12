"use client";

import { useState, useCallback } from "react";
import { buildMarkdown, downloadMarkdown } from "@/lib/markdown";
import type { Journey } from "@/types";

interface ExportPanelProps {
  journal: Journey;
}

export default function ExportPanel({ journal }: ExportPanelProps) {
  const [preview, setPreview] = useState(false);
  const [md, setMd] = useState("");

  const handlePreview = useCallback(() => {
    const result = buildMarkdown(journal);
    setMd(result);
    setPreview(true);
  }, [journal]);

  const handleDownload = useCallback(() => {
    const result = buildMarkdown(journal);
    const filename = journal.title ? `${journal.title}.md` : "travel-journal.md";
    downloadMarkdown(result, filename);
  }, [journal]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handlePreview}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          미리보기
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          .md 다운로드
        </button>
      </div>

      {preview && (
        <div className="relative">
          <button
            onClick={() => setPreview(false)}
            className="absolute right-2 top-2 text-xs text-gray-400 hover:text-gray-600 z-10"
          >
            닫기
          </button>
          <pre className="max-h-80 overflow-auto rounded-md bg-gray-900 p-3 text-xs text-green-300">
            {md}
          </pre>
        </div>
      )}
    </div>
  );
}
