export function loadKakaoMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }

    if (window.kakao?.maps?.LatLng) {
      resolve();
      return;
    }

    const tryLoad = () => {
      if (window.kakao?.maps && typeof (kakao.maps as any).load === "function") {
        (kakao.maps as any).load(() => {
          if (window.kakao?.maps?.LatLng) {
            resolve();
          } else {
            reject(new Error("load 콜백 후에도 LatLng 없음"));
          }
        });
        return true;
      }
      return false;
    };

    if (tryLoad()) return;

    let elapsed = 0;
    const iv = setInterval(() => {
      if (tryLoad()) {
        clearInterval(iv);
      } else {
        elapsed += 100;
        if (elapsed > 15000) {
          clearInterval(iv);
          reject(new Error("SDK 타임아웃"));
        }
      }
    }, 100);
  });
}
