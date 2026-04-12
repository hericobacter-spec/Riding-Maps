let loadPromise: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps?.LatLng && (window.kakao as any).maps?.services?.Places) {
      resolve();
      return;
    }

    let elapsed = 0;
    const iv = setInterval(() => {
      if (window.kakao?.maps?.LatLng && (window.kakao as any).maps?.services?.Places) {
        clearInterval(iv);
        resolve();
        return;
      }

      if (window.kakao?.maps && typeof (window.kakao as any).maps.load === "function" && elapsed >= 2000) {
        clearInterval(iv);
        (window.kakao as any).maps.load(() => {
          const checkServices = () => {
            if ((window.kakao as any).maps?.services?.Places) {
              resolve();
            } else {
              setTimeout(checkServices, 200);
            }
          };
          checkServices();
        });
        return;
      }

      elapsed += 100;
      if (elapsed > 20000) {
        clearInterval(iv);
        loadPromise = null;
        reject(new Error("SDK 타임아웃"));
      }
    }, 100);
  });

  return loadPromise;
}
