import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      // Bilder komprimeres på klienten før opplasting; dette er kun margin
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
