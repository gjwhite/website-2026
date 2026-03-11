import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "a.storyblok.com", pathname: "/**" },
      { protocol: "https", hostname: "a-us.storyblok.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Private-Network",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
