import { loadKakaoMaps } from "./kakaoLoader";
import type { SearchResult } from "@/types";

export async function searchPlace(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  await loadKakaoMaps();

  if (!(kakao.maps as any).services?.Places) {
    console.error("searchPlace: kakao.maps.services.Places not available");
    console.log("kakao.maps keys:", Object.keys(kakao.maps));
    return [];
  }

  return new Promise((resolve) => {
    const places = new (kakao.maps as any).services.Places();
    places.keywordSearch(
      query,
      (result: any[], status: string) => {
        if (status !== (kakao.maps as any).services.OK) {
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
