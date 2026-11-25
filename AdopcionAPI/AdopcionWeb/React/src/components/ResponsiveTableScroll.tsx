import type { ReactNode } from "react";

interface ResponsiveTableScrollProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableScroll({
  children,
  className = "",
}: ResponsiveTableScrollProps) {
  return (
    <div
      className={`w-full max-w-full overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] ${className}`}
    >
      {children}
    </div>
  );
}
