import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/insights", destination: "/monthly?tab=insights", permanent: true },
      { source: "/checkin", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
