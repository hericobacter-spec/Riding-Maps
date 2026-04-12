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

    let elapsed = 0;
    const iv = setInterval(() => {
      if (window.kakao?.maps?.LatLng) {
        clearInterval(iv);
        resolve();
      } else {
        elapsed += 100;
        if (elapsed > 15000) {
          clearInterval(iv);
          reject(new Error("Kakao Maps SDK load timeout - window.kakao: " + !!window.kakao));
        }
      }
    }, 100);
  });
}
