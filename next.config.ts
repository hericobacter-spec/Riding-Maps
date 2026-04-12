import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://dapi.kakao.com https://*.kakao.com",
              "style-src 'self' 'unsafe-inline' https://*.kakao.com",
              "img-src 'self' data: blob: https://*.kakao.com https://*.daum.net https://*.kakaocdn.net",
              "connect-src 'self' https://*.kakao.com https://*.daum.net https://router.project-osrm.org",
              "font-src 'self' https://*.kakao.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
