import Link from "next/link";
import Image from "next/image";

/**
 * NotFound Page — 404 Error Display
 */
export default function NotFound() {
  return (
    <main className="fixed inset-0 h-screen w-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[var(--color-primary)] opacity-[0.05] blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-[var(--color-primary)] opacity-[0.05] blur-[120px] rounded-full" />

      {/* Content */}
      <div className="relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden">
             <Image 
                src="/pic.jpg" 
                alt="Logo" 
                fill 
                className="object-cover scale-[1.4]" 
                priority
             />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-[120px] md:text-[180px] font-black tracking-tighter leading-none mb-4 text-[var(--color-primary)] opacity-20 select-none">
          404
        </h1>
        
        <div className="mt-[-60px] md:mt-[-90px] relative">
          <h2 className="text-2xl md:text-4xl font-bold text-[var(--color-black)] mb-3 tracking-tight">
             ขออภัย ไม่พบหน้าที่คุณต้องการ
          </h2>
          <p className="text-sm md:text-base text-[var(--color-gray-500)] max-w-md mx-auto mb-10 leading-relaxed">
            หน้าที่คุณกำลังมองหาอาจถูกลบไปแล้ว หรือคุณอาจจะพิมพ์ URL ผิด 
            ลองกลับไปตั้งหลักที่หน้าแรกดูไหม?
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center px-10 py-4 bg-[var(--color-primary)] text-white font-bold rounded-2xl
                       transition-all duration-200
                       shadow-[0_8px_0_0_#9293FF]
                       hover:shadow-[0_10px_0_0_#9293FF]
                       hover:-translate-y-1
                       active:translate-y-1 active:shadow-none"
          >
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}
