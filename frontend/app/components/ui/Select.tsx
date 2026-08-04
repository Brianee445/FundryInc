import { cn } from "@/app/lib/utils";
import { forwardRef, SelectHTMLAttributes } from "react";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "w-full bg-secondaryBg border border-borderColor rounded-input px-5 py-4 text-primaryText placeholder-secondaryText focus:border-primaryBlue focus:ring-1 focus:ring-primaryBlue outline-none transition appearance-none",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
export { Select };
