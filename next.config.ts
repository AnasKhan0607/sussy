import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = withPWA({
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
});

export default nextConfig;
