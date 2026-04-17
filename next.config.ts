import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/app/:path*", destination: "/console/:path*", permanent: true },
      { source: "/api/:path*", destination: "/api/v1/:path*", permanent: false },
    ];
  },
};

export default config;
