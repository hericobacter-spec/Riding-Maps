export function loadKakaoMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }

    if (window.kakao?.maps?.LatLng && (kakao.maps as any).services?.Places) {
      resolve();
      return;
    }

    let resolved = false;

    const doResolve = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    const tryLoad = (): boolean | "loading" => {
      if (window.kakao?.maps?.LatLng && (kakao.maps as any).services?.Places) {
        return true;
      }
      if (window.kakao?.maps && typeof (kakao.maps as any).load === "function") {
        try {
          (kakao.maps as any).load(() => {
            doResolve();
          });
        } catch {
          doResolve();
        }
        return "loading";
      }
      return false;
    };

    const result = tryLoad();
    if (result === true) { doResolve(); return; }

    let elapsed = 0;
    const iv = setInterval(() => {
      const r = tryLoad();
      if (r === true || r === "loading") {
        clearInterval(iv);
        if (r === true) doResolve();
      } else {
        elapsed += 100;
        if (elapsed > 15000) {
          clearInterval(iv);
          reject(new Error("SDK 타임아웃"));
        }
      }
    }, 100);

    setTimeout(() => {
      if (!resolved) doResolve();
    }, 5000);
  });
}
