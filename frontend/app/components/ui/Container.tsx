import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-7xl mx-auto px-6 md:px-12 w-full", className)}>
      {children}
    </div>
  );
}
