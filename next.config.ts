import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    SERPAPI_KEY: process.env.SERPAPI_KEY,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  },
};

export default nextConfig;
