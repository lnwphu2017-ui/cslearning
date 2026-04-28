"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface AuthNavbarProps {
  className?: string;
}

export function AuthNavbar({ className = "" }: AuthNavbarProps) {
  const { user, openModal, logout } = useAuth();

  return (
    <nav className={`z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-gray-200)] shadow-sm ${className}`}>
      <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group/logo">
          <div className="w-9 h-9 bg-[var(--color-primary)] rounded-[10px] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm">
             {/* Target Layers */}
             <div className="w-6 h-6 bg-white rounded-[6px] flex items-center justify-center">
                <div className="w-3 h-3 bg-[var(--color-primary)] rounded-[3px]" />
             </div>
             <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-30" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[var(--color-primary)] group-hover:opacity-80 transition-all">CSLearning</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--color-gray-600)] hidden sm:block">
              {user.displayName || user.email}
            </span>
            <button 
              onClick={logout}
              className="px-4 py-1.5 text-sm font-medium text-[var(--color-gray-500)] hover:text-black transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button 
            onClick={openModal}
            className="px-6 py-2 text-sm font-bold bg-[var(--color-primary)] text-white rounded-xl
                       transition-all duration-200
                       shadow-[0_4px_0_0_rgba(100,90,240,1)]
                       hover:shadow-[0_6px_0_0_rgba(100,90,240,1)]
                       hover:-translate-y-0.5
                       active:translate-y-1 active:shadow-none"
          >
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}
