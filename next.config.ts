import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully disable dev indicators and error overlay
  devIndicators: false,
  reactStrictMode: false,

  // Disable the error overlay completely
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
