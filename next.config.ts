import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/goals", destination: "/budget?tab=goals", permanent: true },
      { source: "/fixed", destination: "/budget?tab=fixed", permanent: true },
      { source: "/insights", destination: "/monthly?tab=insights", permanent: true },
      { source: "/checkin", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
