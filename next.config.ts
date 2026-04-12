import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: { browser: "./empty-module.js" },
      zlib: { browser: "./empty-module.js" },
    },
  },
};

export default nextConfig;
