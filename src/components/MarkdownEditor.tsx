"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "여행 메모를 작성하세요 (마크다운 지원)...",
  minRows = 6,
}: MarkdownEditorProps) {
  const [focus, setFocus] = useState(false);

  if (!focus && !value) {
    return (
      <div
        onClick={() => setFocus(true)}
        className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-400 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
        style={{ minHeight: minRows * 24 }}
      >
        {placeholder}
      </div>
    );
  }

  return (
    <div data-color-mode="light" className="rounded-md overflow-hidden border border-gray-200">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        preview="edit"
        hideToolbar={false}
        height={minRows * 32}
        textareaProps={{ placeholder }}
      />
      <div className="flex justify-end bg-white px-2 py-1 border-t">
        <button
          onClick={() => setFocus(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
