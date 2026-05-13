import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@help-platform/shared", "@help-platform/database"],
};

export default nextConfig;
