import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only needed for the Docker image; Vercel's
  // own build pipeline breaks (404 NOT_FOUND) if this is set.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
