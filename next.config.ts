import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  /** Next.js 16 기본 번들러(Turbopack)와 `webpack` 설정 공존 시 dev가 종료되므로 명시한다. */
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      // Windows file lock(UNKNOWN open) 회피를 위해 dev 캐시를 메모리 기반으로 단순화.
      config.cache = false;
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
