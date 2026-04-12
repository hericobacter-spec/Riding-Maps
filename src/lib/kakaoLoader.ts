export function loadKakaoMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }

    if (window.kakao?.maps?.LatLng && (kakao.maps as any).services) {
      resolve();
      return;
    }

    const tryLoad = () => {
      if (window.kakao?.maps?.LatLng && (kakao.maps as any).services) {
        return true;
      }
      if (window.kakao?.maps && typeof (kakao.maps as any).load === "function") {
        (kakao.maps as any).load(() => {
          if (window.kakao?.maps?.LatLng && (kakao.maps as any).services) {
            resolve();
          } else {
            reject(new Error("load 콜백 후에도 services 없음"));
          }
        });
        return "loading";
      }
      return false;
    };

    const result = tryLoad();
    if (result === true) { resolve(); return; }
    if (result === "loading") { return; }

    let elapsed = 0;
    const iv = setInterval(() => {
      const r = tryLoad();
      if (r === true) {
        clearInterval(iv);
        resolve();
      } else if (r === "loading") {
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
