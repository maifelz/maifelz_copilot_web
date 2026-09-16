import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In Next.js 16, Turbopack is default. We explicitly configure it here
  // to silence warnings while keeping Turbopack enabled.
  turbopack: {},
};

export default nextConfig;
