import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.dummyjson.com",
      },
    ],
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "radix-ui",
      "sonner",
      "next-themes",
      "class-variance-authority",
    ],
  },

  // HTTP-заголовки безопасности (правило §6)
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
      ],
    },
  ],
};

export default nextConfig;
