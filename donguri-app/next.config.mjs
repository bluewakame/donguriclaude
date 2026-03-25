/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "donguri-orcin.vercel.app"],
    },
  },
  webpack: (config, { nextRuntime }) => {
    // Edge Runtime (middleware) で __dirname が未定義になる問題を回避
    // ua-parser-js (Next.js内部依存) が __dirname を参照するため
    if (nextRuntime === "edge") {
      config.node = {
        ...config.node,
        __dirname: true,
      };
    }
    return config;
  },
};

export default nextConfig;
