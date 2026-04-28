import type { Metadata } from "next";
import "./globals.css";

/* ===== SEO: Metadata สำหรับทั้งเว็บไซต์ ===== */
export const metadata: Metadata = {
  title: "CSLearning — เรียน CS อย่างฉลาดด้วย AI",
  description:
    "แพลตฟอร์มเรียน Computer Science ที่ใช้ AI ช่วยสร้าง Quiz, Flashcard และตอบคำถามตรงตามเนื้อหาหลักสูตร สำหรับนักศึกษาวิทยาการคอมพิวเตอร์",
  keywords: [
    "CSLearning",
    "Computer Science",
    "AI Learning",
    "Quiz Generator",
    "Flashcard",
    "วิทยาการคอมพิวเตอร์",
  ],
};

import { AuthProvider } from "@/contexts/AuthContext";
import { BackgroundAnimation } from "@/components/BackgroundAnimation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        <BackgroundAnimation />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
