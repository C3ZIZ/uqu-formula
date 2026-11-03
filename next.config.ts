// Next.js settings: standalone output keeps the Docker image small.
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  images: { formats: ["image/webp"] },
};

export default nextConfig;
