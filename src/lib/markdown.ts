import type { Journey } from "@/types";

export function buildMarkdown(journal: Journey): string {
  const lines: string[] = [];

  lines.push(`# ${journal.title || "여행 경로"}`);
  lines.push("");
  lines.push(`> ${new Date(journal.createdAt).toLocaleDateString("ko-KR")} 여행 기록`);
  lines.push("");

  if (journal.content.trim()) {
    lines.push(journal.content.trim());
    lines.push("");
  }

  if (journal.stops.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 경로 요약");
    lines.push("");

    const totalDist = journal.stops.reduce((acc, s, i) => {
      if (i === 0) return 0;
      return acc;
    }, 0);

    lines.push("| 순서 | 장소 | 유형 | 사진 |");
    lines.push("|------|------|------|------|");
    journal.stops.forEach((stop, i) => {
      const typeLabel =
        stop.type === "origin" ? "출발" : stop.type === "destination" ? "도착" : "경유";
      lines.push(
        `| ${i + 1} | ${stop.name} | ${typeLabel} | ${stop.photos.length}장 |`
      );
    });
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  journal.stops.forEach((stop, i) => {
    const typeLabel =
      stop.type === "origin"
        ? "출발지"
        : stop.type === "destination"
          ? "도착지"
          : "경유지";

    lines.push(`## ${i + 1}. ${stop.name} (${typeLabel})`);
    lines.push("");
    lines.push(
      `- 위치: [${stop.position.lat.toFixed(6)}, ${stop.position.lng.toFixed(6)}](https://www.openstreetmap.org/?mlat=${stop.position.lat}&mlon=${stop.position.lng}#map=16/${stop.position.lat}/${stop.position.lng})`
    );

    if (stop.photos.length > 0) {
      lines.push(`- 사진: ${stop.photos.length}장`);
    }
    lines.push("");

    if (stop.photos.length > 0) {
      stop.photos.forEach((photo) => {
        lines.push(`![${photo.fileName}](${photo.originalUrl})`);
        lines.push("");
      });
    }

    if (stop.content.trim()) {
      lines.push(stop.content.trim());
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  });

  return lines.join("\n");
}

export function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".mdx") ? filename : `${filename}.mdx`;
  a.click();
  URL.revokeObjectURL(url);
}
