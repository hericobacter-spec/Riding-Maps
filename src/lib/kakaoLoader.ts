export function loadKakaoMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"));
      return;
    }

    if (window.kakao?.maps) {
      resolve();
      return;
    }

    let elapsed = 0;
    const iv = setInterval(() => {
      if (window.kakao?.maps) {
        clearInterval(iv);
        resolve();
      } else {
        elapsed += 100;
        if (elapsed > 15000) {
          clearInterval(iv);
          reject(new Error("SDK 타임아웃 - kakao: " + !!window.kakao + ", document.scripts: " + document.querySelectorAll('script[src*="kakao"]').length));
        }
      }
    }, 100);
  });
}
