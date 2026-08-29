import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the production Docker image (standalone output)
  // This makes `next build` emit a self-contained server.js
  output: "standalone",
};

export default nextConfig;
