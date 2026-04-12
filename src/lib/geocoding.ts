import { loadKakaoMaps } from "./kakaoLoader";
import type { SearchResult } from "@/types";

export async function searchPlace(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  await loadKakaoMaps();

  const services = (kakao.maps as any).services;
  if (!services?.Places) {
    throw new Error("장소 검색 서비스를 사용할 수 없습니다");
  }

  return new Promise((resolve, reject) => {
    const places = new services.Places();
    places.keywordSearch(
      query,
      (result: any[], status: string, pagination: any) => {
        console.log("searchPlace result:", { query, status, resultCount: result?.length, firstResult: result?.[0] });
        if (status === services.OK) {
          resolve(
            result.map((r) => ({
              display_name: r.place_name,
              lat: r.y,
              lon: r.x,
              address: r.address_name,
              roadAddress: r.road_address_name,
              phone: r.phone,
              placeUrl: r.place_url,
            }))
          );
        } else if (status === services.ZERO_RESULT) {
          resolve([]);
        } else {
          reject(new Error("검색 실패: status=" + status));
        }
      }
    );
  });
}
