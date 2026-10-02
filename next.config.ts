import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Comprobantes de pago (máx. 4 MB) y logos. Vercel limita el cuerpo a 4.5 MB.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
