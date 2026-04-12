export function loadKakaoMaps(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.kakao?.maps) {
      resolve();
      return;
    }
    const check = () => {
      if (window.kakao?.maps) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}
