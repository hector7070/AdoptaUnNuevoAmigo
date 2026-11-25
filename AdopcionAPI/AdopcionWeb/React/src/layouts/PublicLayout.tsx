import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { PublicNavbar } from "@/components/PublicNavbar";

interface PublicLayoutProps {
  availableCount?: number;
  onLoginClick: () => void;
  children: ReactNode;
}

export function PublicLayout({
  availableCount,
  onLoginClick,
  children,
}: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#FAF8F5] text-[#11181C]">
      <PublicNavbar availableCount={availableCount} onLoginClick={onLoginClick} />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-8 pt-5 sm:px-6 md:px-8 md:pt-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
