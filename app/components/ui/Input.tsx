import { cn } from "@/app/lib/utils";
import { forwardRef, InputHTMLAttributes } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "w-full bg-secondaryBg border border-borderColor rounded-input px-5 py-4 text-primaryText placeholder-secondaryText focus:border-primaryBlue focus:ring-1 focus:ring-primaryBlue outline-none transition",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
