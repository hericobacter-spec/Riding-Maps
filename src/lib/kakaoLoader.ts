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

    if (window.kakao?.maps && typeof kakao.maps.load === "function") {
      kakao.maps.load!(() => resolve());
      return;
    }

    let elapsed = 0;
    const iv = setInterval(() => {
      if (window.kakao?.maps?.LatLng) {
        clearInterval(iv);
        resolve();
      } else if (window.kakao?.maps && typeof kakao.maps.load === "function") {
        clearInterval(iv);
        kakao.maps.load!(() => resolve());
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
