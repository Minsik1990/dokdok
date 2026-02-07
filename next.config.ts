import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "search1.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "image.aladin.co.kr",
      },
      {
        protocol: "https",
        hostname: "nxofxjputwsgbujbjlus.supabase.co",
      },
    ],
    // 도서 커버 이미지에 최적화된 사이즈 설정
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [48, 64, 80, 96, 128],
    formats: ["image/avif", "image/webp"],
  },
  // 번들 최적화: 트리셰이킹 강화
  experimental: {
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
};

export default nextConfig;
