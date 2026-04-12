import { loadKakaoMaps } from "./kakaoLoader";
import type { SearchResult } from "@/types";

export async function searchPlace(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  await loadKakaoMaps();

  if (!window.kakao?.maps?.services?.Places) {
    console.error("kakao.maps.services not available");
    return [];
  }

  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places();
    places.keywordSearch(
      query,
      (result, status) => {
        if (status !== kakao.maps.services.OK) {
          resolve([]);
          return;
        }
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
      }
    );
  });
}
