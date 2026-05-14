import type { NextConfig } from "next";

// กำหนด Backend URL จาก Environment Variable (รองรับ Vercel Production)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const nextConfig: NextConfig = {
  // ตั้งค่า rewrites เพื่อ proxy API requests ไปยัง Backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },

  // ปิดการแสดง source map ใน production เพื่อความปลอดภัย
  productionBrowserSourceMaps: false,

  // ตั้งค่า images สำหรับ Vercel deployment
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
