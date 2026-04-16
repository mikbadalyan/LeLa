import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/static/**"
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/picture/**"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/static/**"
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/picture/**"
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/static/**"
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/picture/**"
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/static/**"
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/picture/**"
      }
    ]
  }
};

export default nextConfig;
