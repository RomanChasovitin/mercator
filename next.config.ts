import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted in this worktree to avoid workspace auto-detection issues.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
