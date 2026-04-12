const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || "";

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

    const existing = document.querySelector('script[data-kakao-maps]');
    if (existing) {
      waitForKakao(resolve, reject);
      return;
    }

    const script = document.createElement("script");
    script.setAttribute("data-kakao-maps", "true");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services`;
    script.async = false;
    script.defer = false;

    script.onload = () => {
      waitForKakao(resolve, reject);
    };
    script.onerror = () => {
      reject(new Error("SDK 스크립트 다운로드 실패 - 네트워크 또는 키 문제"));
    };

    document.head.appendChild(script);
  });
}

function waitForKakao(resolve: () => void, reject: (e: Error) => void) {
  let elapsed = 0;
  const iv = setInterval(() => {
    if (window.kakao?.maps?.LatLng) {
      clearInterval(iv);
      resolve();
    } else if (window.kakao?.maps) {
      clearInterval(iv);
      resolve();
    } else {
      elapsed += 100;
      if (elapsed > 10000) {
        clearInterval(iv);
        reject(new Error("SDK 로딩 타임아웃 - kakao 객체: " + !!window.kakao));
      }
    }
  }, 100);
}
