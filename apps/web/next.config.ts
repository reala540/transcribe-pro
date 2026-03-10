import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
  transpilePackages: ["@transcribe/db", "@transcribe/storage"]
};

export default nextConfig;
