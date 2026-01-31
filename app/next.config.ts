import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node-pty is a native module — exclude from webpack bundling
  serverExternalPackages: ["node-pty"],
};

export default nextConfig;
