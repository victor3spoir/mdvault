import type { NextConfig } from "next";

const nextConfig: NextConfig & { serverActions?: { bodySizeLimit: string } } = {
  /* config options here */
  reactCompiler: true,
  typedRoutes: true,
  output: "standalone",
  serverActions: {
    bodySizeLimit: "10mb", // Allow up to 10MB for file uploads
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
