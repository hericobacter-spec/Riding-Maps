const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "";

function injectScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps?.LatLng) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existing) {
      waitReady(resolve, reject);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services`;
    script.async = false;
    script.onload = () => waitReady(resolve, reject);
    script.onerror = () => reject(new Error("Kakao SDK script load failed"));
    document.head.appendChild(script);
  });
}

function waitReady(resolve: (v: void) => void, reject: (e: Error) => void) {
  let elapsed = 0;
  const iv = setInterval(() => {
    if (window.kakao?.maps?.LatLng) {
      clearInterval(iv);
      resolve();
    } else {
      elapsed += 100;
      if (elapsed > 10000) {
        clearInterval(iv);
        reject(new Error("Kakao Maps SDK load timeout"));
      }
    }
  }, 100);
}

export function loadKakaoMaps(): Promise<void> {
  return injectScript();
}
