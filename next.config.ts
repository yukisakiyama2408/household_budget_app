import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/fixed", destination: "/budget?tab=fixed", permanent: true },
      { source: "/insights", destination: "/monthly?tab=insights", permanent: true },
      { source: "/checkin", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
